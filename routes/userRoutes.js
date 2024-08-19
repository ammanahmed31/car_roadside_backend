// routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByUsername, updateUser } = require('../models/user');
const db = require('../database');


const router = express.Router();

const SECRET_KEY = 'your_jwt_secret_key';

// User Registration
router.post('/register', async (req, res) => {
    const { name, username, email, address, mobile_no, password } = req.body;
    if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Name, username, email, and password are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        createUser({ name, username, email, address, mobile_no, password: hashedPassword }, (err, user) => {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully', user });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration' });
    }
});


// User Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    findUserByUsername(username, async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ message: 'Login successful', token });
        } catch (error) {
            res.status(500).json({ error: 'Server error during login' });
        }
    });
});


// Fetch User Details with Auth
router.get('/user/:identifier', (req, res) => {
    console.log('Fetching user details for:', req.params.identifier);
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        const { identifier } = req.params;
        const isNumeric = /^\d+$/.test(identifier);

        const query = isNumeric
            ? `SELECT * FROM users WHERE id = ?`
            : `SELECT * FROM users WHERE username = ?`;

        const param = isNumeric ? parseInt(identifier, 10) : identifier;

        db.get(query, [param], (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(404).json({ error: 'User not found' });
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        });
    });
});


// Update User Info
router.put('/update', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        const { name, username, email, address, mobile_no } = req.body;
        if (!name || !username || !email) {
            return res.status(400).json({ error: 'Name, username, and email are required' });
        }
        updateUser(decoded.id, { name, username, email, address, mobile_no }, (err) => {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'User updated successfully' });
        });
    });
});


module.exports = router;

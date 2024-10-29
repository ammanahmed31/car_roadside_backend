const express = require('express');
const jwt = require('jsonwebtoken');
const { createContact, updateContact, deleteContact, getContactsByUserId } = require('../models/contacts');
const db = require('../database');
const router = express.Router();

const SECRET_KEY = 'your_jwt_secret_key';

// Middleware for authentication
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization token is required' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        req.userId = decoded.id;  // Save userId in request object
        next();
    });
};

// Add Contact
router.post('/add', authenticate, (req, res) => {
    const { name, phoneNumber, email, relationship } = req.body;
    if (!name || !email || !relationship) {
        return res.status(400).json({ error: 'Name, email, and relationship are required' });
    }

    createContact(req.userId, { name, phoneNumber, email, relationship }, (err, contact) => {
        if (err) return res.status(500).json({ error: 'Failed to add contact' });
        res.status(201).json({ message: 'Contact added successfully', contact });
    });
});

// Update Contact
router.put('/update/:id', authenticate, (req, res) => {
    const { name, phoneNumber, email, relationship } = req.body;
    const contactId = req.params.id;

    if (!name || !email || !relationship) {
        return res.status(400).json({ error: 'Name, email, and relationship are required' });
    }

    updateContact(contactId, { name, phoneNumber, email, relationship }, (err, updatedContact) => {
        if (err) {
            if (err.message === 'Contact not found or no changes made') {
                return res.status(404).json({ error: 'Contact not found' });
            }
            return res.status(500).json({ error: 'Failed to update contact' });
        }
        res.status(200).json({ message: 'Contact updated successfully', contact: updatedContact });
    });
});


// Delete Contact
router.delete('/delete/:id', authenticate, (req, res) => {
    const contactId = req.params.id;

    deleteContact(contactId, (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete contact' });
        res.status(200).json({ message: 'Contact deleted successfully' });
    });
});

// Get All Contacts for a User
router.get('/list', authenticate, (req, res) => {
    getContactsByUserId(req.userId, (err, contacts) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch contacts' });
        res.status(200).json({ contacts });
    });
});

module.exports = router;

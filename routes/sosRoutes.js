const express = require('express');
const jwt = require('jsonwebtoken');
const { sendSOS, getSOSRequests, acknowledgeSOS, getRecipients } = require('../models/sos');
const router = express.Router();
const db = require('../database');

const SECRET_KEY = 'your_jwt_secret_key';

// Middleware for authentication
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization token is required' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

// Send SOS API
router.post('/send', authenticate, async (req, res) => {
    const { latitude, longitude, message } = req.body;
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Location is required' });
    }
    
    const sosId = await sendSOS(req.userId, latitude, longitude, message);
    const recipients = await getRecipients(req.userId);
    
    res.json({ success: true, sosId, recipients });
});

// Listen to SOS API
router.get('/listen', authenticate, async (req, res) => {
    const sosRequests = await getSOSRequests(req.userId);
    res.json(sosRequests);
});

// Acknowledge SOS API
router.post('/acknowledge', authenticate, async (req, res) => {
    const { sosId } = req.body;
    if (!sosId) return res.status(400).json({ error: 'SOS ID is required' });
    
    await acknowledgeSOS(req.userId, sosId);
    res.json({ success: true, message: 'SOS acknowledged' });
});

module.exports = router;
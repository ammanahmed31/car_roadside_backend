const express = require('express');
const admin = require('../firebase-config');
const { getContactsByUserId } = require('../models/contacts');

const router = express.Router();

// SOS Notification Endpoint
router.post('/send', async (req, res) => {
  const { userId, latitude, longitude } = req.body;

  if (!userId || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required fields: userId, latitude, or longitude.' });
  }

  try {
    const contacts = await getContactsByUserId(userId);
    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ error: 'No contacts found for the user.' });
    }

    // Extract FCM tokens
    const tokens = contacts.map(contact => contact.fcmToken).filter(Boolean);
    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No valid FCM tokens found in contacts.' });
    }

    const message = {
      notification: {
        title: '🚨 SOS Alert!',
        body: 'A contact needs help! Tap to view location.',
      },
      data: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        senderId: userId.toString(),
      },
    };

    const response = await admin.messaging().sendMulticast({ tokens, ...message });
    return res.status(200).json({
      success: true,
      message: 'SOS notifications sent successfully.',
      response,
    });
  } catch (error) {
    console.error('Error sending SOS:', error);
    return res.status(500).json({ error: 'Failed to send notifications.' });
  }
});

module.exports = router;

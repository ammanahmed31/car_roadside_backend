const express = require('express');
const admin = require('../firebase-config');
const { getContactsByUserId } = require('../models/contacts');
const db = require('../database'); // Import your database connection
const util = require('util');

const router = express.Router();

// Convert db.get into a Promise-based function
const dbGetAsync = util.promisify(db.get).bind(db);

// Function to get FCM token and name of a user
const getUserDetails = async (userId) => {
  const query = `SELECT fcmToken, name FROM users WHERE id = ?`;
  try {
    const row = await dbGetAsync(query, [userId]);
    return row ? { fcmToken: row.fcmToken, name: row.name } : { fcmToken: null, name: null };
  } catch (error) {
    console.error(`Error fetching user details for user ${userId}:`, error);
    return { fcmToken: null, name: null };
  }
};

// SOS Notification Endpoint
router.post('/send', async (req, res) => {
  const { userId, latitude, longitude } = req.body;

  if (!userId || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required fields: userId, latitude, or longitude.' });
  }

  try {
    // Fetch sender details (FCM token & name)
    const senderDetails = await getUserDetails(userId);
    if (!senderDetails.name) {
      return res.status(400).json({ error: 'Sender not found in the database.' });
    }

    const contacts = await getContactsByUserId(userId);
    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ error: 'No contacts found for the user.' });
    }

    // Fetch FCM tokens for all contacts asynchronously
    const tokenResults = await Promise.allSettled(
      contacts.filter(contact => contact.user_id !== null).map(contact => getUserDetails(contact.user_id))
    );

    // Extract only the fulfilled tokens
    const tokens = tokenResults
      .filter(result => result.status === 'fulfilled' && result.value.fcmToken !== null)
      .map(result => result.value.fcmToken);

    console.log('FCM Tokens:', tokens);
    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No valid FCM tokens found for contacts.' });
    }

    // Construct the FCM message
    const message = {
      notification: {
        title: '🚨 SOS Alert!',
        body: `${senderDetails.name} needs help! Tap to view location.`,
      },
      data: {
        senderName: senderDetails.name,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        senderId: userId.toString(),
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channel_id: "sos_channel_id",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            contentAvailable: true,
          },
        },
      },
    };

    console.log('Sending SOS notifications:', message);

    // Send notifications
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: message.notification,
        data: message.data,
      });

      console.log('SOS notifications sent successfully:', response);
      return res.status(200).json({
        success: true,
        message: 'SOS notifications sent successfully.',
        response,
      });
    } catch (error) {
      console.error('Error sending SOS:', error);
      return res.status(500).json({ error: 'Failed to send notifications.' });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Failed to send notifications due to an internal server error.' });
  }
});

module.exports = router;

const express = require('express');
const admin = require('../firebase-config');
const { getContactsByUserId } = require('../models/contacts');
const db = require('../database'); // Import your database connection
const util = require('util');

const router = express.Router();

const dbGetAsync = util.promisify(db.get).bind(db);
const dbRunAsync = util.promisify(db.run).bind(db);

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

const saveSosRequest = async (userId, latitude, longitude) => {
  const query = `INSERT INTO sos_requests (user_id, latitude, longitude) VALUES (?, ?, ?)`;
  return new Promise((resolve, reject) => {
    db.run(query, [userId, latitude, longitude], function (err) {
      if (err) {
        console.error('Error saving SOS request:', err);
        return reject(err);
      }
      console.log('SOS request saved to database with ID:', this.lastID);
      resolve(this.lastID); // Retrieve the inserted row ID
    });
  });
};




// SOS Notification Endpoint
router.post('/send', async (req, res) => {
  const { userId, latitude, longitude } = req.body;

  if (!userId || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required fields: userId, latitude, or longitude.' });
  }

  try {
    // Save the SOS request and get its ID
    const sosId = await saveSosRequest(userId, latitude, longitude);

    const senderDetails = await getUserDetails(userId);
    if (!senderDetails.name) {
      return res.status(400).json({ error: 'Sender not found in the database.' });
    }

    const contacts = await getContactsByUserId(userId);
    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ error: 'No contacts found for the user.' });
    }

    const tokenResults = await Promise.allSettled(
      contacts.filter(contact => contact.user_id !== null).map(contact => getUserDetails(contact.user_id))
    );
    const tokens = tokenResults
      .filter(result => result.status === 'fulfilled' && result.value.fcmToken !== null)
      .map(result => result.value.fcmToken);

    console.log('FCM Tokens:', tokens);
    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No valid FCM tokens found for contacts.' });
    }

    const message = {
      notification: {
        title: '🚨 SOS Alert!',
        body: `${senderDetails.name} needs help! Tap to view location.`,
      },
      data: {
        sosId: sosId.toString(), // Include SOS ID in the notification data
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
        sosId, // Return SOS ID in response
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

router.post('/acknowledge', async (req, res) => {
  const { sosId } = req.body;

  if (!sosId) {
    return res.status(400).json({ error: 'Missing required field: sosId.' });
  }

  try {
    const query = `UPDATE sos_requests SET isAcknowledged = 1 WHERE id = ?`;

    const result = await new Promise((resolve, reject) => {
      db.run(query, [sosId], function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes);
      });
    });

    if (result === 0) {
      return res.status(404).json({ error: 'SOS request not found or already acknowledged.' });
    }

    return res.status(200).json({ success: true, message: 'SOS request acknowledged successfully.' });
  } catch (error) {
    console.error('Error acknowledging SOS request:', error);
    return res.status(500).json({ error: 'Failed to acknowledge SOS request due to an internal server error.' });
  }
});

router.get('/status/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Missing required parameter: userId.' });
  }

  try {
    const query = `SELECT id, isAcknowledged FROM sos_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1`;

    const result = await dbGetAsync(query, [userId]);

    if (!result) {
      return res.status(404).json({ error: 'No SOS request found for this user.' });
    }

    return res.status(200).json({
      success: true,
      sosId: result.id,
      sosAcknowledged: result.isAcknowledged,
    });
  } catch (error) {
    console.error('Error fetching SOS status:', error);
    return res.status(500).json({ error: 'Failed to fetch SOS status due to an internal server error.' });
  }
});



module.exports = router;

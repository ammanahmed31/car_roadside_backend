const admin = require('firebase-admin');

// Load the service account key JSON file
const serviceAccount = require('./firebase-service-account.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount) // Authenticate with the service account
});

module.exports = admin; // Export the initialized Firebase instance

const db = require('../database');

async function sendSOS(userId, latitude, longitude, message) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO SOSRequest (user_id, latitude, longitude, message, timestamp, isAcknowledged) VALUES (?, ?, ?, ?, datetime('now'), 0)`,
            [userId, latitude, longitude, message], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

async function getSOSRequests(userId) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM SOSRequest WHERE user_id = ?`, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function acknowledgeSOS(sosId) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE SOSRequest SET isAcknowledged = 1 WHERE requestId = ?`,
            [sosId], function (err) {
                if (err) reject(err);
                else resolve(true);
            }
        );
    });
}

async function getRecipients(userId) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM contacts WHERE user_id = ?`, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { sendSOS, getSOSRequests, acknowledgeSOS, getRecipients };
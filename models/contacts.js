const db = require('../database');

// Create a new contact
const createContact = (userId, { name, phoneNumber, email, relationship }, callback) => {
    const query = `INSERT INTO contacts (user_id, name, phoneNumber, email, relationship) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [userId, name, phoneNumber, email, relationship], function (err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, userId, name, phoneNumber, email, relationship });
    });
};

// Update an existing contact
const updateContact = (contactId, { name, phoneNumber, email, relationship }, callback) => {
    const query = `UPDATE contacts SET name = ?, phoneNumber = ?, email = ?, relationship = ? WHERE id = ?`;
    db.run(query, [name, phoneNumber, email, relationship, contactId], function (err) {
        if (err) return callback(err);
        if (this.changes === 0) {
            return callback(new Error('Contact not found or no changes made'));
        }
        callback(null, { id: contactId, name, phoneNumber, email, relationship });
    });
};


// Delete a contact
const deleteContact = (contactId, callback) => {
    const query = `DELETE FROM contacts WHERE id = ?`;
    db.run(query, [contactId], function (err) {
        if (err) return callback(err);
        callback(null, { message: 'Contact deleted successfully' });
    });
};

// Find contacts by user ID
const getContactsByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT contacts.*, users.fcmToken AS fcmToken
            FROM contacts
            LEFT JOIN users ON contacts.email = users.email
            WHERE contacts.user_id = ?
        `;
        db.all(query, [userId], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};


module.exports = { createContact, updateContact, deleteContact, getContactsByUserId };

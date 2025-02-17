const db = require('../database');

// Create a new contact
const createContact = (userId, { name, phoneNumber, email, relationship }, callback) => {
    const checkUserQuery = `SELECT id FROM users WHERE email = ?`;
    db.get(checkUserQuery, [email], (err, user) => {
        if (err) return callback(err);
        const appId = user ? user.id : null;
        const insertQuery = `INSERT INTO contacts (user_id, name, phoneNumber, email, relationship, app_id) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(insertQuery, [userId, name, phoneNumber, email, relationship, appId], function (err) {
            if (err) return callback(err);
            callback(null, { id: this.lastID, userId, name, phoneNumber, email, relationship, appId });
        });
    });
};

// Update an existing contact
const updateContact = (contactId, { name, phoneNumber, email, relationship }, callback) => {
    const checkUserQuery = `SELECT id FROM users WHERE email = ?`;
    db.get(checkUserQuery, [email], (err, user) => {
        if (err) return callback(err);
        const appId = user ? user.id : null;
        const updateQuery = `
            UPDATE contacts 
            SET name = ?, phoneNumber = ?, email = ?, relationship = ?, app_id = ? 
            WHERE id = ?`;
        db.run(updateQuery, [name, phoneNumber, email, relationship, appId, contactId], function (err) {
            if (err) return callback(err);
            if (this.changes === 0) {
                return callback(new Error('Contact not found or no changes made'));
            }
            callback(null, { id: contactId, name, phoneNumber, email, relationship, appId });
        });
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
const getContactsByUserId = (userId, callback) => {
    const query = `SELECT * FROM contacts WHERE user_id = ?`;
    db.all(query, [userId], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
};

module.exports = { createContact, updateContact, deleteContact, getContactsByUserId };

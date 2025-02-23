const db = require('../database');

// Create a new contact
const createContact = (userId, { name, phoneNumber, email, relationship }, callback) => {
    const checkUserQuery = `SELECT id FROM users WHERE email = ?`;
    db.get(checkUserQuery, [email], (err, row) => {
        if (err) return callback(err);
        const newUserId = row ? row.id : null;
        const query = `INSERT INTO contacts (user_id, created_by, name, phoneNumber, email, relationship) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(query, [newUserId, userId, name, phoneNumber, email, relationship], function (err) {
            if (err) return callback(err);
            callback(null, { id: this.lastID, user_id: newUserId, name, phoneNumber, email, relationship });
        });
    });
};


// Update an existing contact
const updateContact = (contactId, { name, phoneNumber, email, relationship }, callback) => {
    const checkUserQuery = `SELECT id FROM users WHERE email = ?`;
    db.get(checkUserQuery, [email], (err, row) => {
        if (err) return callback(err);
        const newUserId = row ? row.id : null;
        const query = `UPDATE contacts SET user_id = ?, name = ?, phoneNumber = ?, email = ?, relationship = ? WHERE id = ?`;
        db.run(query, [newUserId, name, phoneNumber, email, relationship, contactId], function (err) {
            if (err) return callback(err);
            if (this.changes === 0) {
                return callback(new Error('Contact not found or no changes made'));
            }
            callback(null, { id: contactId, user_id: newUserId, name, phoneNumber, email, relationship });
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

const getContactsByUserId = async (userId) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM contacts WHERE created_by = ?`;
      db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
};

  

module.exports = { createContact, updateContact, deleteContact, getContactsByUserId };
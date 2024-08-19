// models/user.js
const db = require('../database');

const createUser = (user, callback) => {
    const { name, username, email, address, mobile_no, password } = user;
    const query = `INSERT INTO users (name, username, email, address, mobile_no, password) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [name, username, email, address, mobile_no, password], function (err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, ...user });
    });
};

const findUserByUsername = (username, callback) => {
    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], (err, row) => {
        if (err) return callback(err);
        callback(null, row);
    });
};

const updateUser = (id, user, callback) => {
    const { name, username, email, address, mobile_no } = user;
    const query = `
        UPDATE users
        SET name = ?, username = ?, email = ?, address = ?, mobile_no = ?
        WHERE id = ?
    `;
    db.run(query, [name, username, email, address, mobile_no, id], function (err) {
        if (err) return callback(err);
        callback(null);
    });
};

module.exports = {
    createUser,
    findUserByUsername,
    updateUser,
};

// app.js
const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(bodyParser.json());

app.use('/api/users', userRoutes);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

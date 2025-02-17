const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const sosRoutes = require('./routes/sosRoutes');
var cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(
    bodyParser.urlencoded({
        limit: '10mb',
        extended: true,
        parameterLimit: 50000
    })
);

// Use user routes
app.use('/api/users', userRoutes);

// Use contact routes
app.use('/api/contacts', contactRoutes);

app.use('/api/sos', sosRoutes);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to enable CORS
app.use(cors());

// Middleware to parse URL-encoded data and JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a route for the root URL to serve 'signin.html'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// Mount authentication routes
app.use('/auth', authRoutes);

// Handle undefined routes with a 404 response
app.use((req, res) => {
  res.status(404).send('404 Not Found: The requested resource does not exist.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

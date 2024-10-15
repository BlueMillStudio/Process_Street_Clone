// server.js

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./config/workflow-harmony-firebase-adminsdk-tdeux-e1be9e1ff8.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
});

// Import routes
const taskRoutes = require('./routes/tasks');
const workflowRoutes = require('./routes/workflows'); // Add this line

// Use routes
app.use('/api/tasks', taskRoutes);
app.use('/api/workflows', workflowRoutes); // Add this line


// Root route
app.get('/', (req, res) => {
    res.send('Task Manager API');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Sorry, that route doesn't exist." });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Log all routes
console.log('Registered routes:');
app._router.stack.forEach(function (r) {
    if (r.route && r.route.path) {
        console.log(r.route.path)
    } else if (r.name === 'router') {
        r.handle.stack.forEach(function (nestedRoute) {
            if (nestedRoute.route) {
                console.log(r.regexp, nestedRoute.route.path)
            }
        })
    }
});
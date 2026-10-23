const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from CI/CD pipeline Rahul again!', version: '1.0.0' });
});

// Health check: Load Balancer isse app ki sehat check karta hai
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = app;

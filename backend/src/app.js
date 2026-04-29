const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running smoothly!' });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/hostels', require('./routes/hostel.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/tenants', require('./routes/tenant.routes'));
app.use('/api/contracts', require('./routes/contract.routes'));
app.use('/api/services', require('./routes/service.routes'));
app.use('/api/electricity', require('./routes/electricity.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/activities', require('./routes/activity.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// End of routes registration



// Catch-all Error format (placeholder)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

module.exports = app;

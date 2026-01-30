// src/app.js
// Express app setup (middleware + routes)

const express = require("express");
const bookingsRouter = require("./routes/bookings");

const app = express();
app.use(express.json());

// Mount bookings routes
app.use("/bookings", bookingsRouter);

module.exports = app;

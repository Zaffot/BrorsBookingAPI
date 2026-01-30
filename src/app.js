// index.js
// Simple meeting room booking API (Node.js + Express)
// - In-memory storage
// - Only the required endpoints and status codes
// - ISO 8601 times stored with Date.toISOString()

const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// Predefined rooms (no room CRUD)
const ROOMS = new Set(["huone1", "huone2", "huone3", "huone4", "huone5"]);

// In-memory storage for bookings
// Booking shape: { bookingId, roomId, startTime, endTime }
const bookings = [];

/**
 * Helper: send error in required format
 */
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

/**
 * Helper: parse and validate times + business rules
 * Returns { startDate, endDate } on success, otherwise sends 400 and returns null.
 */
function validateTimes(req, res, startTime, endTime) {
  if (typeof startTime !== "string" || typeof endTime !== "string") {
    sendError(res, 400, "startTime ja endTime pitää olla ISO 8601 -merkkijonoja.");
    return null;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    sendError(res, 400, "Aikamuoto virheellinen. Käytä ISO 8601 -muotoa.");
    return null;
  }

  if (startDate >= endDate) {
    sendError(res, 400, "Aloitusajan täytyy olla ennen lopetusaikaa.");
    return null;
  }

  const now = new Date();
  if (startDate < now || endDate < now) {
    sendError(res, 400, "Varaus ei saa sijoittua menneisyyteen.");
    return null;
  }

  return { startDate, endDate };
}

/**
 * Helper: overlap check
 * overlap if startA < endB && startB < endA
 */
function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * Helper: check if booking overlaps any existing booking in same room
 */
function hasOverlap(roomId, startDate, endDate) {
  return bookings.some((b) => {
    if (b.roomId !== roomId) return false;
    const existingStart = new Date(b.startTime);
    const existingEnd = new Date(b.endTime);
    return overlaps(startDate, endDate, existingStart, existingEnd);
  });
}

/**
 * POST /bookings - create booking
 * Body: { roomId, startTime, endTime }
 * Returns 201 + created booking JSON
 */
app.post("/bookings", (req, res) => {
  const { roomId, startTime, endTime } = req.body || {};

  if (typeof roomId !== "string" || !ROOMS.has(roomId)) {
    return sendError(res, 400, "roomId on pakollinen ja sen täytyy olla yksi: huone1..huone5.");
  }

  const validated = validateTimes(req, res, startTime, endTime);
  if (!validated) return; // validateTimes already responded with 400

  const { startDate, endDate } = validated;

  // Overlap rule (back-to-back is allowed by overlap formula)
  if (hasOverlap(roomId, startDate, endDate)) {
    return sendError(res, 409, "Päällekkäinen varaus samassa huoneessa.");
  }

  const booking = {
    bookingId: crypto.randomUUID(),
    roomId,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  };

  bookings.push(booking);
  return res.status(201).json(booking);
});

/**
 * GET /bookings?roomId=...
 * Returns 200 + list of bookings for the room sorted by startTime asc
 */
app.get("/bookings", (req, res) => {
  const roomId = req.query.roomId;

  if (typeof roomId !== "string" || !ROOMS.has(roomId)) {
    return sendError(res, 400, "Query-parametri roomId on pakollinen ja sen täytyy olla yksi: huone1..huone5.");
  }

  const roomBookings = bookings
    .filter((b) => b.roomId === roomId)
    .slice()
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return res.status(200).json(roomBookings);
});

/**
 * DELETE /bookings/:bookingId
 * Returns 204 if deleted, 404 if not found
 */
app.delete("/bookings/:bookingId", (req, res) => {
  const { bookingId } = req.params;

  const index = bookings.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) {
    return sendError(res, 404, "Varausta ei löydy annetulla bookingId:llä.");
  }

  bookings.splice(index, 1);
  return res.status(204).send();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Booking API running on http://localhost:${PORT}`);
});

module.exports = app;
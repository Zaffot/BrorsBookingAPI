// __tests__/bookings.test.js
const request = require("supertest");

function loadFreshApp() {
  // Reload modules so the in-memory bookings array starts empty for each test.
  jest.resetModules();
  return require("../src/app");
}

function futureISO(offsetMinutes) {
  const base = Date.parse("2099-01-01T00:00:00.000Z");
  return new Date(base + offsetMinutes * 60 * 1000).toISOString();
}

describe("Meeting room Booking API (/bookings)", () => {
  describe("POST /bookings", () => {
    test("201: creates a booking with valid payload", async () => {
      const app = loadFreshApp();

      const res = await request(app).post("/bookings").send({
        roomId: "huone1",
        startTime: futureISO(10),
        endTime: futureISO(70),
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("bookingId");
      expect(res.body).toMatchObject({
        roomId: "huone1",
      });
      expect(typeof res.body.startTime).toBe("string");
      expect(typeof res.body.endTime).toBe("string");
    });

    test("400: rejects invalid time format (not ISO 8601 Z)", async () => {
      const app = loadFreshApp();

      const res = await request(app).post("/bookings").send({
        roomId: "huone1",
        startTime: "05-05-2026 10:00",
        endTime: "05-05-2026 11:00",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: expect.any(String) });
    });

    test("409: rejects overlapping booking in same room", async () => {
      const app = loadFreshApp();

      const start1 = futureISO(10);
      const end1 = futureISO(70);

      const start2 = futureISO(40); // overlaps with 10..70
      const end2 = futureISO(100);

      const first = await request(app).post("/bookings").send({
        roomId: "huone1",
        startTime: start1,
        endTime: end1,
      });
      expect(first.status).toBe(201);

      const second = await request(app).post("/bookings").send({
        roomId: "huone1",
        startTime: start2,
        endTime: end2,
      });

      expect(second.status).toBe(409);
      expect(second.body).toEqual({ error: expect.any(String) });
    });
  });

  describe("GET /bookings?roomId=...", () => {
    test("200: lists bookings for a room sorted by startTime asc", async () => {
      const app = loadFreshApp();

      // Create two bookings intentionally out of chronological order
      const later = await request(app).post("/bookings").send({
        roomId: "huone2",
        startTime: futureISO(60),
        endTime: futureISO(120),
      });
      expect(later.status).toBe(201);

      const earlier = await request(app).post("/bookings").send({
        roomId: "huone2",
        startTime: futureISO(10),
        endTime: futureISO(50),
      });
      expect(earlier.status).toBe(201);

      const res = await request(app).get("/bookings").query({ roomId: "huone2" });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);

      const times = res.body.map((b) => b.startTime);
      expect(times[0] <= times[1]).toBe(true);

      // Ensure only the requested room is returned
      for (const b of res.body) {
        expect(b.roomId).toBe("huone2");
      }
    });

    test("400: rejects missing/invalid roomId query", async () => {
      const app = loadFreshApp();

      const res = await request(app).get("/bookings"); // no roomId

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: expect.any(String) });
    });
  });

  describe("DELETE /bookings/:bookingId", () => {
    test("204: deletes an existing booking", async () => {
      const app = loadFreshApp();

      const created = await request(app).post("/bookings").send({
        roomId: "huone3",
        startTime: futureISO(10),
        endTime: futureISO(70),
      });
      expect(created.status).toBe(201);

      const bookingId = created.body.bookingId;
      expect(typeof bookingId).toBe("string");

      const del = await request(app).delete(`/bookings/${bookingId}`);

      expect(del.status).toBe(204);
      expect(del.text).toBe("");

      // Verify it is gone: deleting again should yield 404
      const delAgain = await request(app).delete(`/bookings/${bookingId}`);
      expect(delAgain.status).toBe(404);
      expect(delAgain.body).toEqual({ error: expect.any(String) });
    });

    test("404: returns not found for unknown bookingId", async () => {
      const app = loadFreshApp();

      const res = await request(app).delete("/bookings/does-not-exist");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: expect.any(String) });
    });
  });
});

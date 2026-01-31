// scripts/cli.js
// Terminal CLI for Booking API (interactive)
// Commands: create, list, delete
// - Uses fetch to call http://localhost:3000
// - Forces ISO 8601 Z input: YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss.sssZ
// - Prints API { error } message on failures
// - Interactive menu loop + clean exit

const { createInterface } = require("readline/promises");
const { stdin, stdout } = require("process");

const BASE_URL = "http://localhost:3000";
const ISO_8601_Z_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

function isValidIso8601Z(value) {
  return typeof value === "string" && ISO_8601_Z_REGEX.test(value);
}

async function readJsonSafely(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function printApiError(res) {
  const body = await readJsonSafely(res);
  if (body && typeof body.error === "string") {
    console.error(`Error: ${body.error}`);
    return;
  }
  console.error(`Error: HTTP ${res.status}`);
}

async function promptUntil(rl, question, validator, errorMsg) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const answer = (await rl.question(question)).trim();
    if (validator(answer)) return answer;
    console.log(errorMsg);
  }
}

function printMenu() {
  console.log("\n=== Booking API CLI ===");
  console.log("1) create  - Luo varaus");
  console.log("2) list    - Listaa huoneen varaukset");
  console.log("3) delete  - Poista varaus bookingId:llä");
  console.log("4) exit    - Lopeta");
}

async function chooseMenuOption(rl) {
  const raw = (await rl.question("\nValitse (1-4) tai kirjoita create/list/delete/exit: ")).trim().toLowerCase();

  if (raw === "1" || raw === "create") return "create";
  if (raw === "2" || raw === "list") return "list";
  if (raw === "3" || raw === "delete") return "delete";
  if (raw === "4" || raw === "exit" || raw === "lopeta") return "exit";

  return "unknown";
}

async function createBooking(rl) {
  const roomId = await promptUntil(
    rl,
    "roomId (huone1..huone5): ",
    (v) => ["huone1", "huone2", "huone3", "huone4", "huone5"].includes(v),
    "Virhe: roomId pitää olla yksi: huone1, huone2, huone3, huone4, huone5."
  );

  const startTime = await promptUntil(
    rl,
    "startTime (ISO 8601 Z, esim. 2026-02-01T10:00:00Z tai 2026-02-01T10:00:00.123Z): ",
    isValidIso8601Z,
    "Virhe: startTime pitää olla ISO 8601 Z -muodossa (YYYY-MM-DDTHH:mm:ssZ tai YYYY-MM-DDTHH:mm:ss.sssZ)."
  );

  const endTime = await promptUntil(
    rl,
    "endTime (ISO 8601 Z, esim. 2026-02-01T11:00:00Z tai 2026-02-01T11:00:00.123Z): ",
    isValidIso8601Z,
    "Virhe: endTime pitää olla ISO 8601 Z -muodossa (YYYY-MM-DDTHH:mm:ssZ tai YYYY-MM-DDTHH:mm:ss.sssZ)."
  );

  const res = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, startTime, endTime }),
  });

  if (!res.ok) {
    await printApiError(res);
    return;
  }

  const created = await res.json();
  console.log("\nCreated:");
  console.log(JSON.stringify(created, null, 2));
}

async function listBookings(rl) {
  const roomId = await promptUntil(
    rl,
    "roomId (huone1..huone5): ",
    (v) => ["huone1", "huone2", "huone3", "huone4", "huone5"].includes(v),
    "Virhe: roomId pitää olla yksi: huone1, huone2, huone3, huone4, huone5."
  );

  const res = await fetch(`${BASE_URL}/bookings?roomId=${encodeURIComponent(roomId)}`);

  if (!res.ok) {
    await printApiError(res);
    return;
  }

  const list = await res.json();
  console.log(`\nBookings for ${roomId}:`);
  console.log(JSON.stringify(list, null, 2));
}

async function deleteBooking(rl) {
  const bookingId = await promptUntil(
    rl,
    "bookingId: ",
    (v) => v.length > 0,
    "Virhe: bookingId ei saa olla tyhjä."
  );

  const res = await fetch(`${BASE_URL}/bookings/${encodeURIComponent(bookingId)}`, {
    method: "DELETE",
  });

  if (res.status === 204) {
    console.log("\nDeleted (204).");
    return;
  }

  // Expecting { error: string } on 404 / 400 etc.
  await printApiError(res);
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    let running = true;

    while (running) {
      printMenu();
      const action = await chooseMenuOption(rl);

      if (action === "create") {
        await createBooking(rl);
      } else if (action === "list") {
        await listBookings(rl);
      } else if (action === "delete") {
        await deleteBooking(rl);
      } else if (action === "exit") {
        running = false;
        console.log("\nMoikka! 👋");
      } else {
        console.log("\nTuntematon valinta. Sallitut: 1-4 tai create/list/delete/exit (tai lopeta).");
      }
    }
  } catch (err) {
    console.error("Error:", err && err.message ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();

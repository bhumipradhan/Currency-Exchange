import express from "express";

const app = express();
const PORT = 5000;

app.use(express.json()); // lets us read JSON request bodies

const VALID_CURRENCIES = ["USD", "EUR", "NPR", "INR", "GBP"];

// In-memory storage: resets when the server restarts (allowed by the brief)
let expenses = [];
let nextId = 1;

app.get("/expenses", (req, res) => {
  res.json(expenses);
});

app.post("/expenses", (req, res) => {
  const { title, amount, currency, date } = req.body;

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required." });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Amount must be a number greater than 0." });
  }
  const code = typeof currency === "string" ? currency.toUpperCase() : "";
  if (!VALID_CURRENCIES.includes(code)) {
    return res.status(400).json({
      error: `Currency must be one of: ${VALID_CURRENCIES.join(", ")}.`,
    });
  }

  let expenseDate = new Date();
  if (date) {
    expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return res.status(400).json({ error: "Date is invalid." });
    }
  }

  const expense = {
    id: nextId++,
    title: title.trim(),
    amount,
    currency: code,
    date: expenseDate.toISOString(),
  };

  expenses.unshift(expense); // newest first, matching what your React code does
  res.status(201).json(expense);
});

app.delete("/expenses/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = expenses.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Expense not be found." });
  }

  expenses.splice(index, 1);
  res.status(204).send();
});

// Cache so we don't hit the external API for every expense
const rateCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getRate(from, to) {
  const key = `${from}_${to}`;
  const cached = rateCache.get(key);

  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return { rate: cached.rate, stale: false };
  }

  // Abort the request if the external API takes longer than 5 seconds
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v2/rate/${from}/${to}`,
      { signal: controller.signal },
    );
    if (!res.ok) throw new Error(`Exchange API responded with ${res.status}`);

    const data = await res.json();
    if (typeof data.rate !== "number") throw new Error("Unexpected API response");

    rateCache.set(key, { rate: data.rate, time: Date.now() });
    return { rate: data.rate, stale: false };
  } catch (err) {
    // If the API fails but we have an old rate, use it rather than failing
    if (cached) return { rate: cached.rate, stale: true };
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

app.get("/convert", async (req, res) => {
  const from = String(req.query.from || "").toUpperCase();
  const to = String(req.query.to || "").toUpperCase();
  const amount = Number(req.query.amount);

  if (!VALID_CURRENCIES.includes(from) || !VALID_CURRENCIES.includes(to)) {
    return res.status(400).json({ error: "Invalid or missing currency code." });
  }
  if (req.query.amount === undefined || !Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: "Amount must be a valid number." });
  }

  if (from === to) {
    return res.json({ from, to, amount, rate: 1, converted: amount, stale: false });
  }

  try {
    const { rate, stale } = await getRate(from, to);
    const converted = Math.round(amount * rate * 100) / 100;
    res.json({ from, to, amount, rate, converted, stale });
  } catch (err) {
    const timedOut = err.name === "AbortError";
    res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "Exchange rate service timed out."
        : "Exchange rate service is unavailable.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
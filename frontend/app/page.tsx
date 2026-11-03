"use client";

import { useState, useEffect, useCallback } from "react";

type Expense = {
  id: string | number;
  title: string;
  amount: number;
  currency: string;
  date?: string;
};

const CURRENCIES = ["USD", "EUR", "NPR", "INR", "GBP"];

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [homeCurrency, setHomeCurrency] = useState("USD");
  const [converted, setConverted] = useState<Record<string, number | null>>({});
  const [convertErrors, setConvertErrors] = useState<Record<string, boolean>>(
    {},
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    currency: "USD",
    date: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Load expenses from the backend on first render ---
  useEffect(() => {
    fetchExpenses();
  }, []);

  // --- Re-convert every expense whenever the list or target currency changes ---
  const convertAll = useCallback(async () => {
    if (expenses.length === 0) {
      setConverted({});
      return;
    }

    const newConverted: Record<string, number | null> = {};
    const newErrors: Record<string, boolean> = {};

    await Promise.all(
      expenses.map(async (exp) => {
        if (exp.currency === homeCurrency) {
          newConverted[exp.id] = exp.amount;
          return;
        }
        try {
          const res = await fetch(
            `/convert?from=${exp.currency}&to=${homeCurrency}&amount=${exp.amount}`,
          );
          if (!res.ok) throw new Error("Conversion failed");
          const data = await res.json();
          newConverted[exp.id] = data.converted;
        } catch {
          newConverted[exp.id] = null;
          newErrors[exp.id] = true;
        }
      }),
    );

    setConverted(newConverted);
    setConvertErrors(newErrors);
  }, [expenses, homeCurrency]);

  useEffect(() => {
    convertAll();
  }, [convertAll]);

  const total = expenses.reduce(
    (sum, exp) => sum + (converted[exp.id] ?? 0),
    0,
  );

  return (
    <div className="page">
      <div className="container">
        <div className="title-row">
          <h1 className="title">Expenses</h1>
        </div>

        {/* Add expense form */}
        <form onSubmit={handleAddExpense} className="add-form">
          <input
            type="text"
            placeholder="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input input-title"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="input input-amount"
          />
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="select"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="input input-date"
          />
          <button type="submit" disabled={submitting} className="add-btn">
            +
          </button>
        </form>

        {formError && <p className="error-text">{formError}</p>}

        {/* Expense list */}
        <div className="expense-list">
          <div className="table-header">
            <span className="col-label">Title</span>
            <span className="col-label">Original</span>
            <div className="col-currency">
              <span className="col-label">Converted to</span>
              <select
                value={homeCurrency}
                onChange={(e) => setHomeCurrency(e.target.value)}
                className="currency-select"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <span />
          </div>

          {loading && <p className="dim-text">Loading…</p>}
          {loadError && <p className="error-text">{loadError}</p>}
          {!loading && expenses.length === 0 && (
            <p className="dim-text">No expenses yet.</p>
          )}

          {expenses.map((exp, i) => {
            const conv = converted[exp.id];
            const hasError = convertErrors[exp.id];
            return (
              <div key={exp.id} className={`row${i === 0 ? " row-first" : ""}`}>
                <div>
                  <span className="exp-title">{exp.title}</span>
                  <span className="exp-date">{formatDate(exp.date)}</span>
                </div>
                <span className="mono">
                  {formatMoney(exp.amount, exp.currency)}
                  <span className="currency-tag">{exp.currency}</span>
                </span>
                <span className="mono">
                  {conv !== null && conv !== undefined ? (
                    <>
                      {formatMoney(conv, homeCurrency)}
                      {hasError && <span className="approx-tag">~</span>}
                    </>
                  ) : (
                    <span className="convert-error">error</span>
                  )}
                </span>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="delete-btn"
                  aria-label={`Delete ${exp.title}`}
                >
                  ×
                </button>
              </div>
            );
          })}

          {expenses.length > 0 && (
            <div className="total-row">
              <span className="total-label">Total</span>
              <span className="mono total-amount">
                {formatMoney(total, homeCurrency)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function formatDate(dateStr?: string) {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  }

  async function fetchExpenses() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/expenses");
      if (!res.ok) throw new Error("Failed to load expenses");
      const data: Expense[] = await res.json();
      setExpenses(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load expenses",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const amount = parseFloat(form.amount);
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          amount,
          currency: form.currency,
          date: form.date || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add expense.");
      }

      const newExpense: Expense = await res.json();
      setExpenses((prev) => [newExpense, ...prev]);
      setForm({ title: "", amount: "", currency: form.currency, date: "" });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add expense.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: Expense["id"]) {
    const prevExpenses = expenses;
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    try {
      const res = await fetch(`/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
    } catch {
      setExpenses(prevExpenses); // roll back on failure
    }
  }
}
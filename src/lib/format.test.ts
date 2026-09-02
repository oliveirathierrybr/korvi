import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, parseDateInput, toDateInputValue } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats a number as BRL", () => {
    expect(formatCurrency(1234.5)).toBe(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(1234.5)
    );
  });
});

describe("parseDateInput / toDateInputValue", () => {
  it("round-trips a YYYY-MM-DD value without shifting the calendar day", () => {
    // Regression: new Date("2026-08-31") / toISOString() shifts by a day
    // depending on the server's timezone (UTC vs local midnight) — this is
    // exactly the bug this pair of helpers exists to avoid.
    const value = "2026-08-31";
    expect(toDateInputValue(parseDateInput(value))).toBe(value);
  });

  it("parses as local midnight, not UTC midnight", () => {
    const date = parseDateInput("2026-01-15");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
  });

  it("pads single-digit months and days", () => {
    const date = new Date(2026, 0, 5);
    expect(toDateInputValue(date)).toBe("2026-01-05");
  });
});

describe("formatDate", () => {
  it("formats a Date as dd/mm/yyyy", () => {
    expect(formatDate(new Date(2026, 7, 9))).toBe("09/08/2026");
  });

  it("accepts a date string", () => {
    expect(formatDate("2026-08-09T12:00:00")).toBe("09/08/2026");
  });
});

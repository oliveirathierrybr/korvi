import { describe, expect, it } from "vitest";
import { formatCnpj, isValidCnpj, onlyDigits } from "@/lib/cnpj";

describe("onlyDigits", () => {
  it("strips everything but digits", () => {
    expect(onlyDigits("12.345.678/0001-95")).toBe("12345678000195");
  });
});

describe("formatCnpj", () => {
  it("formats a full CNPJ", () => {
    expect(formatCnpj("12345678000195")).toBe("12.345.678/0001-95");
  });

  it("formats a partial CNPJ progressively", () => {
    expect(formatCnpj("123")).toBe("12.3");
    expect(formatCnpj("12345678")).toBe("12.345.678");
  });
});

describe("isValidCnpj", () => {
  it("accepts a known-valid CNPJ (with formatting)", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });

  it("rejects a CNPJ with a wrong check digit", () => {
    expect(isValidCnpj("11.222.333/0001-80")).toBe(false);
  });

  it("rejects a value with the wrong number of digits", () => {
    expect(isValidCnpj("123")).toBe(false);
  });

  it("rejects all-repeated-digit sequences", () => {
    expect(isValidCnpj("11111111111111")).toBe(false);
  });
});

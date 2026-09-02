import { describe, expect, it } from "vitest";
import { normalize, pickPatternToken } from "@/lib/bank/categorization";

describe("normalize", () => {
  it("uppercases and strips accents", () => {
    expect(normalize("Padaria São José")).toBe("PADARIA SAO JOSE");
  });
});

describe("pickPatternToken", () => {
  it("skips generic banking words and picks the first specific one", () => {
    // Regression case: learning "RECEBIDO" from every incoming PIX would
    // match completely unrelated transactions on future syncs.
    expect(pickPatternToken("PIX RECEBIDO - CLIENTE")).toBe("CLIENTE");
  });

  it("skips PAGAMENTO to find the actual supplier name", () => {
    expect(pickPatternToken("PAGAMENTO FORNECEDOR XPTO")).toBe("FORNECEDOR");
  });

  it("ignores words shorter than 4 letters", () => {
    expect(pickPatternToken("AB CD UBER")).toBe("UBER");
  });

  it("skips a company suffix to find the actual business name", () => {
    expect(pickPatternToken("PADARIA SAO JOSE LTDA")).toBe("PADARIA");
  });

  it("does not learn a company-suffix-only token", () => {
    expect(pickPatternToken("ABC LTDA")).toBeNull();
  });

  it("returns null when every word is generic or too short", () => {
    expect(pickPatternToken("PIX TED DOC")).toBeNull();
  });

  it("returns null for an empty description", () => {
    expect(pickPatternToken("")).toBeNull();
  });
});

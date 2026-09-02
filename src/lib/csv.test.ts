import { describe, expect, it } from "vitest";
import { csvField, toCsvRow } from "@/lib/csv";

describe("csvField", () => {
  it("leaves plain values untouched", () => {
    expect(csvField("Aluguel")).toBe("Aluguel");
  });

  it("quotes values containing the delimiter", () => {
    expect(csvField("Rua A; Rua B")).toBe('"Rua A; Rua B"');
  });

  it("quotes and escapes embedded double quotes", () => {
    expect(csvField('Cliente "VIP"')).toBe('"Cliente ""VIP"""');
  });

  it("quotes values containing newlines", () => {
    expect(csvField("linha1\nlinha2")).toBe('"linha1\nlinha2"');
  });

  it.each(["=cmd|'/c calc'!A1", "+1+1", "-1+1", "@SUM(A1:A9)"])(
    "prefixes a leading formula trigger with an apostrophe: %s",
    (malicious) => {
      const result = csvField(malicious);
      expect(result.startsWith("'")).toBe(true);
      expect(result).toContain(malicious);
    }
  );

  it("does not treat a formula char in the middle of a field as dangerous", () => {
    expect(csvField("Total = 100")).toBe("Total = 100");
  });

  it("neutralizes a formula-triggering field that also needs quoting", () => {
    // Leading "=" neutralized first, then quoted because it contains the delimiter.
    expect(csvField("=A1;B1")).toBe('"\'=A1;B1"');
  });
});

describe("toCsvRow", () => {
  it("joins escaped fields with the delimiter", () => {
    expect(toCsvRow(["a", "b;c", "d"])).toBe('a;"b;c";d');
  });
});

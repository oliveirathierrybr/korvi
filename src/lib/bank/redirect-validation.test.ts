import { describe, expect, it } from "vitest";
import { isAllowedRedirectUri } from "@/lib/bank/redirect-validation";

describe("isAllowedRedirectUri", () => {
  const expected = "https://app.korvi.com.br/api/open-finance/callback";

  it("allows the exact expected URL", () => {
    expect(isAllowedRedirectUri(expected, expected)).toBe(true);
  });

  it("rejects an attacker-controlled external host", () => {
    expect(isAllowedRedirectUri("https://evil.example.com/steal", expected)).toBe(false);
  });

  it("rejects a same-host URL with a different path", () => {
    expect(isAllowedRedirectUri("https://app.korvi.com.br/other", expected)).toBe(false);
  });

  it("rejects protocol-relative or scheme mismatches", () => {
    expect(isAllowedRedirectUri("http://app.korvi.com.br/api/open-finance/callback", expected)).toBe(
      false
    );
  });

  it("rejects a trailing-slash variant (no implicit normalization)", () => {
    expect(isAllowedRedirectUri(`${expected}/`, expected)).toBe(false);
  });
});

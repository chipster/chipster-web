import { describe, expect, it } from "vitest";
import { escapeHtml, unescapeHtml } from "./html";

describe("escapeHtml", () => {
  it("should escape the characters that are special in HTML", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
    );
  });

  it("should escape an ampersand only once", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("should keep plain text unchanged", () => {
    expect(escapeHtml("sample_1.fastq.gz")).toBe("sample_1.fastq.gz");
  });
});

describe("unescapeHtml", () => {
  it("should be the inverse of escapeHtml", () => {
    for (const text of [`<img src=x onerror="alert('x')">&`, "&lt;", "&amp;lt;", "a&&b", "sample_1.fastq.gz", ""]) {
      expect(unescapeHtml(escapeHtml(text))).toBe(text);
    }
  });

  it("should not decode an entity that the original text contained", () => {
    // "&lt;" in the original is "&amp;lt;" escaped, and must come back as "&lt;", not "<"
    expect(unescapeHtml("&amp;lt;")).toBe("&lt;");
  });
});

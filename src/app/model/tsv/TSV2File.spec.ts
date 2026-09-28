import { Dataset } from "chipster-js-common";
import { describe, expect, it } from "vitest";
import { TypeTagService } from "../../shared/services/typetag.service";
import { SessionData } from "../session/session-data";
import TSV2File from "./TSV2File";

describe("TSV2File", () => {
  // no type tags: the first row is the header row
  const typeTagService = { get: () => undefined, has: () => false } as unknown as TypeTagService;

  function create(tsvArray: string[][]): TSV2File {
    return TSV2File.create(tsvArray, new Dataset("test.tsv"), new SessionData(), typeTagService);
  }

  describe("getHeadersForSpreadSheet", () => {
    it("should replace empty and whitespace headers with plain text placeholders", () => {
      const tsv2File = create([
        ["a", "", " ", "   "],
        ["1", "2", "3", "4"],
      ]);
      expect(tsv2File.getHeadersForSpreadSheet()).toEqual(["a", "<empty>", "<space>", "<spaces>"]);
    });

    it("should return the other headers as they are in the file", () => {
      const tsv2File = create([
        ["<img src=x onerror=alert(1)>", "a&b"],
        ["1", "2"],
      ]);
      expect(tsv2File.getHeadersForSpreadSheet()).toEqual(["<img src=x onerror=alert(1)>", "a&b"]);
    });
  });

  describe("getHeadersForParameter", () => {
    it("should name an empty header untitled and keep the other placeholders", () => {
      const tsv2File = create([
        ["a", "", " ", "   "],
        ["1", "2", "3", "4"],
      ]);
      expect(tsv2File.getHeadersForParameter().map((option) => option.displayName)).toEqual([
        "a",
        "untitled",
        "<space>",
        "<spaces>",
      ]);
    });
  });
});

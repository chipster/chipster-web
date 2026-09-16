import { describe, expect, it } from "vitest";
import TSVFile from "../../model/tsv/TSVFile";
import { VisualizationTSVService } from "./visualizationTSV.service";

describe("VisualizationTSVService", () => {
  const service = new VisualizationTSVService();

  function createTSVFile(tsv: Array<Array<string>>) {
    return new TSVFile(tsv, "testid", "testfile.tsv");
  }

  const withSymbol = createTSVFile([
    ["identifier", "symbol", "FC"],
    ["id1", "symbol1", "1.0"],
    ["id2", "symbol2", "2.0"],
    ["id3", "symbol3", "3.0"],
  ]);

  const withoutSymbol = createTSVFile([
    ["identifier", "FC"],
    ["id1", "1.0"],
    ["id2", "2.0"],
  ]);

  // a file where the header row doesn't name the identifier column
  const withoutIdentifier = createTSVFile([
    ["FC", "p"],
    ["id1", "0.01"],
    ["id2", "0.02"],
  ]);

  describe("containsSymbolColumn", () => {
    it("should find the symbol column", () => {
      expect(service.containsSymbolColumn(withSymbol)).toBe(true);
    });

    it("should not find a symbol column in a file without one", () => {
      expect(service.containsSymbolColumn(withoutSymbol)).toBe(false);
    });
  });

  describe("getSelectionRows", () => {
    it("should return the symbol and identifier of the given rows", () => {
      expect(service.getSelectionRows(withSymbol, ["0", "2"])).toEqual([
        { symbol: "symbol1", identifier: "id1" },
        { symbol: "symbol3", identifier: "id3" },
      ]);
    });

    it("should leave the symbol empty in a file without a symbol column", () => {
      expect(service.getSelectionRows(withoutSymbol, ["1"])).toEqual([{ symbol: null, identifier: "id2" }]);
    });

    it("should fall back to the first column when the identifier column isn't named", () => {
      expect(service.getSelectionRows(withoutIdentifier, ["0"])).toEqual([{ symbol: null, identifier: "id1" }]);
    });

    it("should return nothing when nothing is selected", () => {
      expect(service.getSelectionRows(withSymbol, [])).toEqual([]);
    });
  });

  describe("getSelectionRowsFromTSVRows", () => {
    it("should return the same rows as the lookup by id", () => {
      const rowIds = ["0", "2"];
      expect(service.getSelectionRowsFromTSVRows(withSymbol, withSymbol.body.getTSVRows(rowIds))).toEqual(
        service.getSelectionRows(withSymbol, rowIds),
      );
    });

    it("should keep the order of the given rows", () => {
      const reversed = withSymbol.body.getTSVRows(["0", "1"]).reverse();
      expect(service.getSelectionRowsFromTSVRows(withSymbol, reversed)).toEqual([
        { symbol: "symbol2", identifier: "id2" },
        { symbol: "symbol1", identifier: "id1" },
      ]);
    });
  });
});

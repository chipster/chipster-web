import { Dataset } from "chipster-js-common";
import { describe, expect, it } from "vitest";
import { DatasetService } from "./dataset.service";

/*
 * The checks behind the warnings of the phenodata editor. The editor saves the
 * rows joined with tabs and newlines, with a final newline, and an empty cell as
 * an empty string, also at the end of a row.
 */
describe("DatasetService", () => {
  const service = new DatasetService();

  function withPhenodata(content: string): Dataset {
    return { metadataFiles: [{ name: "phenodata.tsv", content }] } as Dataset;
  }

  const noPhenodata = { metadataFiles: [] } as unknown as Dataset;

  describe("hasGroupColumn", () => {
    it("should find the group column anywhere in the headers", () => {
      expect(service.hasGroupColumn(withPhenodata("sample\toriginal_name\tgroup\na\ta.cel\t1\n"))).toBe(true);
      expect(service.hasGroupColumn(withPhenodata("sample\tdescription\tgroup\textra\na\tx\t1\ty\n"))).toBe(true);
    });

    it("should find it in a phenodata without rows", () => {
      expect(service.hasGroupColumn(withPhenodata("sample\toriginal_name\tgroup\n"))).toBe(true);
    });

    it("should not find it in a phenodata without one", () => {
      expect(service.hasGroupColumn(withPhenodata("sample\toriginal_name\tdescription\na\ta.cel\tx\n"))).toBe(false);
    });

    it("should look only at the headers", () => {
      expect(service.hasGroupColumn(withPhenodata("sample\toriginal_name\na\tgroup\n"))).toBe(false);
    });

    it("should not find it without phenodata, or in an empty one", () => {
      expect(service.hasGroupColumn(noPhenodata)).toBe(false);
      expect(service.hasGroupColumn({} as Dataset)).toBe(false);
      expect(service.hasGroupColumn(withPhenodata(""))).toBe(false);
    });
  });

  describe("isPhenodataFilled", () => {
    it("should be filled when every row has a group", () => {
      expect(service.isPhenodataFilled(withPhenodata("sample\tgroup\na\t1\nb\t2\n"))).toBe(true);
    });

    it("should accept empty cells in the other columns", () => {
      expect(service.isPhenodataFilled(withPhenodata("sample\tgroup\tdescription\na\t1\t\nb\t2\t\n"))).toBe(true);
    });

    it("should not be filled when a group is empty, also in the last row or the last column", () => {
      expect(service.isPhenodataFilled(withPhenodata("sample\tgroup\tdescription\na\t\tx\nb\t2\ty\n"))).toBe(false);
      expect(service.isPhenodataFilled(withPhenodata("sample\tgroup\tdescription\na\t1\tx\nb\t\ty\n"))).toBe(false);
      expect(service.isPhenodataFilled(withPhenodata("sample\tgroup\na\t1\nb\t\n"))).toBe(false);
    });

    it("should not be filled when a row is shorter than the headers", () => {
      expect(service.isPhenodataFilled(withPhenodata("sample\tgroup\tdescription\na\t1\tx\nb\t2\n"))).toBe(false);
    });

    it("should not be filled without a group column", () => {
      expect(service.isPhenodataFilled(withPhenodata("sample\tdescription\na\tx\n"))).toBe(false);
    });

    it("should not be filled without rows", () => {
      expect(service.isPhenodataFilled(withPhenodata("sample\tgroup\n"))).toBe(false);
    });

    it("should not be filled without phenodata, or with an empty one", () => {
      expect(service.isPhenodataFilled(noPhenodata)).toBe(false);
      expect(service.isPhenodataFilled({} as Dataset)).toBe(false);
      expect(service.isPhenodataFilled(withPhenodata(""))).toBe(false);
    });
  });
});

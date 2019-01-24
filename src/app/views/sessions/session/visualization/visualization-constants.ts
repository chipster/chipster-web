import { Tags } from "../../../../shared/services/typetag.service";

export default [
  {
    id: "spreadsheet",
    name: "Spreadsheet",
    typeTags: [
      Tags.TSV,
      Tags.BED,
      Tags.GTF,
      Tags.FAI,
      Tags.VCF,
      Tags.MOTHUR_COUNT,
      Tags.MOTHUR_GROUPS,
      Tags.MOTHUR_NAMES,
      Tags.MOTHUR_OLIGOS,
      Tags.MOTHUR_STABILITY
    ],
    supportAllTypes: false,
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "text",
    name: "Text",
    typeTags: [
      Tags.TEXT,
      Tags.TSV,
      Tags.BED,
      Tags.GTF,
      Tags.FAI,
      Tags.VCF,
      Tags.MOTHUR_COUNT,
      Tags.MOTHUR_GROUPS,
      Tags.MOTHUR_NAMES,
      Tags.MOTHUR_OLIGOS,
      Tags.MOTHUR_STABILITY
    ],
    supportAllTypes: false,
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "expressionprofile",
    name: "Expression profile",
    supportAllTypes: false,
    typeTags: [Tags.GENE_EXPRS],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "scatterplot",
    name: "Scatter Plot",
    supportAllTypes: false,
    typeTags: [Tags.GENE_EXPRS],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "image",
    name: "Image",
    typeTags: [Tags.PNG, Tags.JPEG, Tags.GIF],
    supportAllTypes: false,
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "pdf",
    name: "PDF",
    typeTags: [Tags.PDF],
    supportAllTypes: false,
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "html",
    name: "Html",
    typeTags: [Tags.HTML],
    supportAllTypes: false,
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "venn",
    name: "Venn-Diagram",
    typeTags: [Tags.TSV],
    supportAllTypes: false,
    anyInputCountSupported: false,
    supportedInputFileCounts: [2, 3]
  },
  {
    id: "volcanoplot",
    name: "Volcano Plot",
    typeTags: [Tags.PVALUE_AND_FOLD_CHANGE],
    supportAllTypes: false,
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "bamviewer",
    name: "BAM viewer",
    typeTags: [Tags.BAM],
    supportAllTypes: false,
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: "genomebrowser",
    name: "Genome Browser",
    supportAllTypes: false,
    typeTags: [Tags.BAM, Tags.BAI],
    anyInputCountSupported: true
  },
  {
    id: "phenodata",
    name: "Phenodata",
    supportAllTypes: false,
    typeTags: [Tags.GENE_EXPRS, Tags.BAM],
    anyInputCountSupported: true
  },
  {
    id: "details",
    name: "Details",
    typeTags: [],
    supportAllTypes: true,
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  }
];

import { Tags } from "../../../../shared/services/typetag.service";

export interface Visualization {
  id: string;
  name: string;
  typeTags: Array<string>;
  supportAllTypes: boolean;
  anyInputCountSupported?: boolean;
  supportedInputFileCounts?: Array<number>;
}
export default class VisualizationConstants {
  static readonly PHENODATA_ID = "phenodata";
  static readonly DETAILS_ID = "details";
  static readonly NEW_TAB_ID = "new-tab";

  static readonly VISUALIZATIONS: Array<Visualization> = [
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
        Tags.MOTHUR_STABILITY,
        Tags.MOTHUR_SHARED,
        Tags.MOTHUR_TAXONOMY,
      ],
      supportAllTypes: false,
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    {
      id: "text",
      name: "Text",
      typeTags: [Tags.TEXT],
      supportAllTypes: false,
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    {
      id: "expressionprofile",
      name: "Expression profile",
      supportAllTypes: false,
      typeTags: [Tags.GENE_EXPRS],
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    {
      id: "scatterplot",
      name: "Scatter Plot",
      supportAllTypes: false,
      typeTags: [Tags.GENE_EXPRS],
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    {
      id: "image",
      name: "Image",
      typeTags: [Tags.PNG, Tags.JPEG, Tags.GIF],
      supportAllTypes: false,
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    {
      id: "pdf",
      name: "PDF",
      typeTags: [Tags.PDF],
      supportAllTypes: false,
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    {
      id: "html",
      name: "Html",
      typeTags: [Tags.HTML],
      supportAllTypes: false,
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    {
      id: "volcanoplot",
      name: "Volcano Plot",
      typeTags: [Tags.PVALUE_AND_FOLD_CHANGE],
      supportAllTypes: false,
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    // {
    //   id: "bamviewer",
    //   name: "BAM viewer",
    //   typeTags: [Tags.BAM],
    //   supportAllTypes: false,
    //   anyInputCountSupported: false,
    //   supportedInputFileCounts: [1]
    // },
    {
      id: VisualizationConstants.PHENODATA_ID,
      name: "Phenodata",
      supportAllTypes: false,
      typeTags: [Tags.GENE_EXPRS],
      supportedInputFileCounts: [1],
    },
    {
      id: VisualizationConstants.NEW_TAB_ID,
      name: "Open in New Tab",
      typeTags: [],
      supportAllTypes: true,
      anyInputCountSupported: false,
      supportedInputFileCounts: [1],
    },
    {
      id: VisualizationConstants.DETAILS_ID,
      name: "Details",
      typeTags: [],
      supportAllTypes: true,
      anyInputCountSupported: true,
    },
    {
      id: "venn",
      name: "Venn-Diagram",
      typeTags: [Tags.TSV],
      supportAllTypes: false,
      anyInputCountSupported: false,
      supportedInputFileCounts: [2, 3],
    },
  ];
}

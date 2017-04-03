import {Tags} from '../../../../shared/services/typetag.service'

export default [
  {
    id: 'spreadsheet',
    name: 'Spreadsheet',
    typeTags: [Tags.TSV, Tags.BED, Tags.GTF],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'text',
    name: 'Text',
    typeTags: [Tags.TEXT, Tags.TSV, Tags.BED, Tags.GTF],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },

  {
    id: 'expressionprofile',
    name: 'Expression profile',
    typeTags: [Tags.TSV],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'image',
    name: 'Image',
    typeTags: [Tags.PNG, Tags.JPEG, Tags.GIF],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'pdf',
    name: 'PDF',
    typeTags: [Tags.PDF],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'phenodata',
    name: 'Phenodata',
    typeTags: [Tags.TSV, Tags.BAM],
    anyInputCountSupported: true
  },
  {
    id: 'html',
    name: 'Html',
    typeTags: [Tags.HTML],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'venn',
    name: 'Venn-Diagram',
    typeTags: [Tags.TSV],
    anyInputCountSupported: false,
    supportedInputFileCounts: [2, 3]
  }
];

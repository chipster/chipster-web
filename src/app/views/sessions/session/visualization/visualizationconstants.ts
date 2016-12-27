export default [
  {
    id: 'spreadsheet',
    name: 'Spreadsheet',
    extensions: ['tsv', 'bed'],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'text',
    name: 'Text',
    extensions: ['txt', 'tsv', 'bed'],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },

  {
    id: 'expressionprofile',
    name: 'Expression profile',
    extensions: ['tsv'],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'image',
    name: 'Image',
    extensions: ['png', "jpg", "jpeg"],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'pdf',
    name: 'PDF',
    extensions: ['pdf'],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'phenodata',
    name: 'Phenodata',
    extensions: ['tsv', 'bam'],
    anyInputCountSupported: true
  },
  {
    id: 'html',
    name: 'Html',
    extensions: ['html'],
    anyInputCountSupported: false,
    supportedInputFileCounts: [1]
  },
  {
    id: 'venn',
    name: 'Venn-Diagram',
    extensions: ['tsv'],
    anyInputCountSupported: false,
    supportedInputFileCounts: [2, 3]
  }
];

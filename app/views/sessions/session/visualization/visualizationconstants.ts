export default [
    {
        id: 'spreadsheet',
        name: 'Spreadsheet',
        extensions: ['tsv', 'bed'],
        multipleDatasets: false
    },
    {
        id: 'text',
        name: 'Text',
        extensions: ['txt', 'tsv', 'bed'],
        multipleDatasets: false
    },
    {
        id: 'expressionprofile',
        name: 'Expression profile',
        extensions: ['tsv'],
        multipleDatasets: false
    },
    {
        id: 'image',
        name: 'Image',
        extensions: ['png', "jpg", "jpeg"],
        multipleDatasets: false
    },
    {
        id: 'pdf',
        name: 'PDF',
        extensions: ['pdf'],
        multipleDatasets: false
    },

    {
        id: 'phenodata',
        name: 'Phenodata',
        extensions: ['tsv', 'bam'],
        multipleDatasets: true
    },
    {
        id: 'html',
        name: 'Html',
        extensions: ['html'],
        multipleDatasets: false
    }


];
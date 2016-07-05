export default [
    {
        directive: 'image-visualization',
        icon: 'glyphicon-picture',
        name: 'Image',
        extensions: ['png', "jpg", "jpeg"],
        preview: true,
        multipleDatasets: false
    },
    {
        directive: 'pdf-visualization',
        icon: 'glyphicon-book',
        name: 'PDF',
        extensions: ['pdf'],
        preview: true,
        multipleDatasets: false
    },
    {
        directive: 'spreadsheet-visualization',
        icon: 'glyphicon-th',
        name: 'Spreadsheet',
        extensions: ['tsv', 'bed'],
        preview: false,
        multipleDatasets: false
    },
    {
        directive: 'phenodata-visualization',
        icon: 'glyphicon-edit',
        name: 'Phenodata',
        extensions: ['tsv', 'bam'],
        preview: false,
        multipleDatasets: true
    },
    {
        directive: 'html-visualization',
        icon: 'glyphicon-globe',
        name: 'Html',
        extensions: ['html'],
        preview: true,
        multipleDatasets: false
    },
    {
        directive: 'text-visualization',
        icon: 'glyphicon-font',
        name: 'Text',
        extensions: ['txt', 'tsv', 'bed'],
        preview: false,
        multipleDatasets: false
    }
];
import MetadataEntry from "./metadataentry";

export default class Dataset {

    constructor(name: string) {
        this.name = name;
    }

    checksum: string;
    datasetId: string;
    fileId: string;
    metadata: MetadataEntry[];
    typeTags: {[key:string]:string;};
    name: string;
    notes: string;
    size: number;
    sourceJob: string;
    x: number;
    y: number;
}

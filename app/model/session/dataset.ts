import MetadataEntry from "./metadataentry";

export default class Dataset {
    checksum: string;
    datasetId: string;
    fileId: string;
    metadata: MetadataEntry[];
    name: string;
    notes: string;
    size: number;
    sourceJob: string;
    x: number;
    y: number;
}
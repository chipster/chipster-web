import {Tag} from "../../../../shared/services/typetag.service";

export default class Visualization {
    directive: string;
    icon: string;
    name: string;
    typeTags: Tag[];
    preview: boolean;
    multipleDatasets: boolean;
}

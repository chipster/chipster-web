import Name from "./name";

export default class Parameter {
    defaultValue: string;
    defaultValues: string[];
    description: string;
    from: number;
    name: Name;
    optional: boolean;
    selectionOptions: string[];
    to: number;
    type: string;
}
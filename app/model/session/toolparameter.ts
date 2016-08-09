import Name from "./name";

export default class ToolParameter {

    defaultValue: string;
    defaultValues: string[];
    description: string;
    from: number;
    name: Name;
    optional: boolean;
    selectionOptions: any[];
    to: number;
    type: string;
}
import ToolParameter from "./toolparameter";

export default class JobParameter {

    parameterId: string;
    displayName: string;
    description: string;
    type: string;
    value: number|string;
    toolParameter?: ToolParameter;
}
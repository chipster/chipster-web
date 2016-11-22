import Name from "./name";
import Output from "./output";
import Parameter from "./toolparameter";
import ToolInput from "./toolinput";

export default class Tool {
    description: string;
    inputs: ToolInput[];
    name: Name;
    outputs: Output[];
    parameters: Parameter[];
}
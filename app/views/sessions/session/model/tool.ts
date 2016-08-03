import Name from "./name";
import Input from "./input";
import Output from "./output";
import Parameter from "./parameter";

export default class Tool {
    description: string;
    inputs: Input[];
    name: Name;
    outputs: Output[];
    parameters: Parameter[];
}
import Input from "./input";
import Parameter from "./parameter";
export default class Job {
    endTime: string;
    inputs: Input[];
    jobId: string;
    module: string;
    parameters: Parameter[];
    screenOutput: string;
    sourceCode: string;
    startTime: string;
    state: string;
    stateDetail: string;
    toolCategory: string;
    toolDescription: string;
    toolId: string;
    toolName: string;
}
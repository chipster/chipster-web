import JobInput from "./jobinput";
import JobParameter from "./jobparameter";

export default class Job {

    endTime: string;
    inputs: JobInput[];
    jobId: string;
    module: string;
    parameters: JobParameter[];
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
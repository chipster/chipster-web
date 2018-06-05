import Module from "./module";
import Session from "./session";
import Dataset from "./dataset";
import Job from "./job";
import Tool from "./tool";

export class SessionData {
  session: Session;
  datasetsMap: Map<string, Dataset>;
  jobsMap: Map<string, Job>;
  modules: Module[];
  tools: Tool[];
  modulesMap: Map<string, Module>;
  datasetTypeTags: Map<string, Map<string, string>>;
  deletedDatasets: Array<Dataset>;
}

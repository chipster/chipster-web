import { Module, Dataset, Job, Tool, Session } from "chipster-js-common";

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

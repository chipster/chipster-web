import { Dataset, Job, Session } from "chipster-js-common";

export class SessionData {
  session: Session;
  datasetsMap: Map<string, Dataset>;
  jobsMap: Map<string, Job>;
  datasetTypeTags: Map<string, Map<string, string>>;
}

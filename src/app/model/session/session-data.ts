import { Dataset, Job, Session } from "chipster-js-common";
import { SelectionOption } from "../../views/sessions/session/SelectionOption";

export class SessionData {
  session: Session;
  datasetsMap: Map<string, Dataset>;
  jobsMap: Map<string, Job>;
  datasetTypeTags: Map<string, Map<string, string>>;
  cachedFileHeaders = new Map<string, Array<SelectionOption>>();
}

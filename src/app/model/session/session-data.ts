import { Dataset, Job, Label, Session } from "chipster-js-common";
import { SelectionOption } from "../../views/sessions/session/SelectionOption";

export class SessionData {
  session: Session;
  datasetsMap: Map<string, Dataset>;
  jobsMap: Map<string, Job>;
  labelsMap: Map<string, Label> = new Map();
  datasetTypeTags: Map<string, Map<string, string>>;
  cachedFileHeaders = new Map<string, Array<SelectionOption>>();
}

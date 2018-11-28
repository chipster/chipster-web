import { Module, Dataset, Job, Tool, Session } from "chipster-js-common";

export class UserEventData {
  sessions: Map<string, Session>;
}

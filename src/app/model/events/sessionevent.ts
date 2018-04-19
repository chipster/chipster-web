import Dataset from "../session/dataset";
import Job from "../session/job";
import Session from "../session/session";
import Rule from "../session/rule";

export default class SessionEvent {
    constructor(
      public event: any,
      public oldValue: Dataset | Job | Session | Rule,
      public newValue: Dataset | Job | Session | Rule) {
    }
}

import Dataset from "../session/dataset";
import Job from "../session/job";
import Session from "../session/session";

export default class SessionEvent {
    constructor(
      public event: any,
      public oldValue: Dataset | Job | Session,
      public newValue: Dataset | Job | Session) {
    }
}

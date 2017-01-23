import Dataset from "../session/dataset";
import Job from "../session/job";

export enum Action {
  Add,
  Remove
}

export default class SelectionEvent {

    constructor(
      public action: Action,
      public value: Dataset | Job) {
    }
}

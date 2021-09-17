import { Dataset , Job } from "chipster-js-common";

export enum Action {
  Add,
  Remove,
}

export default class SelectionEvent {
  constructor(public action: Action, public value: Dataset | Job) {}
}

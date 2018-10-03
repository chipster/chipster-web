export enum State {
  Loading = "Loading...",
  Ready = "Ready",
  Fail = "Loading failed"
}

export class LoadState {
  public state: State;
  private _message: string;

  constructor(state: State, message?: string) {
    this.state = state;
    this._message = message;
  }

  get message() {
    return this._message ? this._message : this.state;
  }

  isReady(): boolean {
    return this.state === State.Ready;
  }
}

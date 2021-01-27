export enum State {
  Loading = "Loading...",
  Ready = "Ready",
  EmptyFile = "File is empty",
  Fail = "Loading failed",
  TooLarge = "File is too large",
}

export class LoadState {
  public state: State;
  private _message: string;
  private buttonText;

  constructor(state: State, message?: string, buttonText?: string) {
    this.state = state;
    this._message = message;
    this.buttonText = buttonText;
  }

  get message() {
    return this._message ? this._message : this.state;
  }

  isReady(): boolean {
    return this.state === State.Ready;
  }
}

export enum State {
  Loading = "Loading...",
  Ready = "Ready",
  EmptyFile = "File is empty",
  Fail = "Loading failed",
  TooLarge = "File is too large",
}

export class LoadState {
  static Ready = new LoadState(State.Ready);
  static Loading = new LoadState(State.Loading);
  static EmptyFile = new LoadState(State.EmptyFile);
  static Fail = new LoadState(State.Fail);

  public state: State;
  private _message: string;
  public buttonText;

  constructor(state: State, message?: string, buttonText?: string) {
    this.state = state;
    this._message = message;
    this.buttonText = buttonText;
  }

  get message(): string {
    return this._message ? this._message : this.state;
  }

  isReady(): boolean {
    return this.state === State.Ready;
  }

  isLoading(): boolean {
    return this.state === State.Loading;
  }

  isFail(): boolean {
    return this.state === State.Fail;
  }
}

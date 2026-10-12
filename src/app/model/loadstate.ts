export enum State {
  Loading = "Loading...",
  Ready = "Ready",
  EmptyFile = "File is empty",
  Fail = "Loading failed",
  TooLarge = "File is too large",
}

/*
 * A button of the status component. The action identifies the button when it
 * is clicked, so that the handler doesn't depend on the text shown to the user.
 */
export interface StatusButton {
  text: string;
  action: string;
}

export class LoadState {
  static Ready = new LoadState(State.Ready);
  static Loading = new LoadState(State.Loading);
  static EmptyFile = new LoadState(State.EmptyFile);
  static Fail = new LoadState(State.Fail);

  public state: State;
  private _message: string;
  public buttons: StatusButton[];

  constructor(state: State, message?: string, buttons: StatusButton[] = []) {
    this.state = state;
    this._message = message;
    this.buttons = buttons;
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

  isTooLarge(): boolean {
    return this.state === State.TooLarge;
  }
}

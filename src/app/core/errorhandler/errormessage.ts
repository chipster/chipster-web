export enum ErrorButton {
  Reload = "Reload",
  LogIn = "Log in",
  ContactSupport = "Contact support",
  ShowDetails = "Show details"
}

export enum Level {
  Info = "INFO",
  Warning = "WARNING",
  Error = "ERROR"
}

export class ErrorMessage {
  level = Level.Warning;

  constructor(
    public title: string,
    public msg: string,
    public dismissible: boolean,
    public buttons: ErrorButton[],
    public links: ErrorButton[],
    public error: any
  ) {}
}

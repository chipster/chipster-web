export enum ErrorType {
  CONNECTION_FAILED = "Connection failed",
  FORBIDDEN = "Authentication",
  NOT_FOUND = "Not found",
  NO_RELOAD = "Something went wrong",
  DEFAULT = "Something went wrong",
}

export class ErrorMessage {

  constructor(
    public msg: string,
    public dismissible: boolean,
    public type: ErrorType = ErrorType.DEFAULT,
    public title = "",
  ) { }


  isForbidden(): boolean {
    return this.type === ErrorType.FORBIDDEN;
  }

  isNotFound(): boolean {
    return this.type === ErrorType.NOT_FOUND;
  }

  isConnectionFailed(): boolean {
    return this.type === ErrorType.CONNECTION_FAILED;
  }

  isNoReload(): boolean {
    return this.type === ErrorType.NO_RELOAD;
  }

  isDefault(): boolean {
    return this.type === ErrorType.DEFAULT;
  }
}

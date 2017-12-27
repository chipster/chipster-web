export enum ErrorType {
  CONNECTION_FAILED = "Connection failed",
  FORBIDDEN = "Authentication",
  DEFAULT = "Something went wrong"

}

export class ErrorMessage {

  constructor(
    public msg: string,
    public dismissible: boolean,
    public type: ErrorType = ErrorType.DEFAULT) {}


  isForbidden() : boolean {
    return this.type === ErrorType.FORBIDDEN;
  }

  isConnectionFailed() : boolean {
    return this.type === ErrorType.CONNECTION_FAILED;
  }

  isDefault() : boolean {
    return this.type === ErrorType.DEFAULT;
  }


}

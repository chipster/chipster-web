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

}

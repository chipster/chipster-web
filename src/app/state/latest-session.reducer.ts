export const SET_LATEST_SESSION = "SET_LATEST_SESSION";
export const CLEAR_LATEST_SESSION = "CLEAR_LATEST_SESSION";

export interface LatestSession {
  readonly sessionId: string;
  readonly sourceSessionId?: string;
}

export function latestSession(state: LatestSession = { sessionId: null }, { type, payload }) {
  switch (type) {
    case SET_LATEST_SESSION:
      return payload;
    case CLEAR_LATEST_SESSION:
      return null;
    default:
      return state;
  }
}

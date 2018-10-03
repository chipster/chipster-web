export const SET_LATEST_SESSION = "SET_LATEST_SESSION";
export const CLEAR_LATEST_SESSION = "CLEAR_LATEST_SESSION";

export function latestSession(state: string = null, { type, payload }) {
  switch (type) {
    case SET_LATEST_SESSION:
      return payload;
    case CLEAR_LATEST_SESSION:
      return null;
    default:
      return state;
  }
}

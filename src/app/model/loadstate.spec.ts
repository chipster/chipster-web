import { describe, expect, it } from "vitest";
import { LoadState, State } from "./loadstate";

describe("LoadState", () => {
  it("has no buttons by default", () => {
    expect(new LoadState(State.Loading).buttons).toEqual([]);
  });

  it("uses the state as the message by default", () => {
    expect(new LoadState(State.Fail).message).toBe("Loading failed");
    expect(new LoadState(State.Fail, "Loading pdf file failed").message).toBe("Loading pdf file failed");
  });
});

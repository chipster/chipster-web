import { describe, expect, it } from "vitest";
import { LoadState, State } from "../../model/loadstate";
import { StatusComponent } from "./status.component";

describe("StatusComponent", () => {
  it("emits the action of the clicked button", () => {
    const component = new StatusComponent();
    const first = { text: "First", action: "first" };
    const second = { text: "Second", action: "second" };
    component.state = new LoadState(State.TooLarge, "Too large", [first, second]);
    const emitted: string[] = [];
    component.buttonEvent.subscribe((action) => emitted.push(action));

    component.onButton(second);
    component.onButton(first);

    expect(emitted).toEqual(["second", "first"]);
  });
});

import { describe, expect, it } from "vitest";
import { LoadState, State } from "../../model/loadstate";
import { StatusComponent } from "./status.component";

describe("StatusComponent", () => {
  it("emits the text of the clicked button", () => {
    const component = new StatusComponent();
    component.state = new LoadState(State.TooLarge, "Too large", ["First", "Second"]);
    const emitted: string[] = [];
    component.buttonEvent.subscribe((buttonText) => emitted.push(buttonText));

    component.onButton("Second");
    component.onButton("First");

    expect(emitted).toEqual(["Second", "First"]);
  });
});

describe("LoadState", () => {
  it("has no buttons by default", () => {
    expect(new LoadState(State.Loading).buttonTexts).toEqual([]);
  });
});

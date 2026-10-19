import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { LoadState, State } from "../../model/loadstate";
import { StatusComponent } from "./status.component";

describe("StatusComponent", () => {
  const first = { text: "First", action: "first" };
  const second = { text: "Second", action: "second" };

  let fixture: ComponentFixture<StatusComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StatusComponent] });
    fixture = TestBed.createComponent(StatusComponent);
    element = fixture.nativeElement;
  });

  // sets the input the way a parent template binding does, and renders
  function show(state: LoadState) {
    fixture.componentRef.setInput("state", state);
    fixture.detectChanges();
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll("button"));
  }

  it("shows the message and a button for each action", () => {
    show(new LoadState(State.TooLarge, "Too large", [first, second]));

    expect(element.querySelector("div").textContent).toBe("Too large");
    expect(buttons().map((button) => button.textContent.trim())).toEqual(["First", "Second"]);
    // spacing only between the buttons
    expect(buttons().map((button) => button.classList.contains("ms-2"))).toEqual([false, true]);
  });

  it("emits the action of the clicked button", () => {
    show(new LoadState(State.TooLarge, "Too large", [first, second]));
    const emitted: string[] = [];
    fixture.componentInstance.buttonEvent.subscribe((action) => emitted.push(action));

    buttons()[1].click();
    buttons()[0].click();

    expect(emitted).toEqual(["second", "first"]);
  });

  it("updates the view when the state changes", () => {
    show(new LoadState(State.TooLarge, "Too large", [first, second]));

    show(new LoadState(State.Loading, "Loading"));

    expect(element.querySelector("div").textContent).toBe("Loading");
    expect(buttons()).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { pointerPosition } from "./plot.service";

describe("pointerPosition", () => {
  // d3.pointer() measures from the bounding rectangle of the node when the node
  // is not in an svg, which is all it needs of one here
  const node = {
    getBoundingClientRect: () => ({ left: 5, top: 7 }),
    clientLeft: 0,
    clientTop: 0,
  } as unknown as Element;

  // the position relative to the node, for a client position of 30, 40
  const expected = { x: 25, y: 33 };

  it("should read the coordinates of a mouse event", () => {
    const point = pointerPosition({ clientX: 30, clientY: 40 }, node);
    expect({ x: point.x, y: point.y }).toEqual(expected);
  });

  it("should read the coordinates of a tap, which are in the touch list", () => {
    const point = pointerPosition({ changedTouches: [{ clientX: 30, clientY: 40 }] }, node);
    expect({ x: point.x, y: point.y }).toEqual(expected);
  });

  it("should read the coordinates of a touch that is still down", () => {
    const point = pointerPosition({ touches: [{ clientX: 30, clientY: 40 }] }, node);
    expect({ x: point.x, y: point.y }).toEqual(expected);
  });

  it("should look the coordinates up in the source event of a d3 event", () => {
    const point = pointerPosition({ sourceEvent: { changedTouches: [{ clientX: 30, clientY: 40 }] } }, node);
    expect({ x: point.x, y: point.y }).toEqual(expected);
  });
});

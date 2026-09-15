import { describe, expect, it } from "vitest";
import Point from "../model/point";
import { ExpressionProfileService } from "./expression-profile.service";
import Line from "./line";

describe("ExpressionProfileService", () => {
  // distanceToLine() doesn't use the tsv service
  const service = new ExpressionProfileService(null);

  describe("distanceToLine", () => {
    const horizontal = new Line("line1", 0, 0, 10, 0);

    it("should return zero for a point on the line", () => {
      expect(service.distanceToLine(new Point(5, 0), horizontal)).toBe(0);
    });

    it("should measure perpendicular distance from the middle of the line", () => {
      expect(service.distanceToLine(new Point(5, 3), horizontal)).toBe(3);
    });

    it("should measure the distance to the closest end point beyond the line", () => {
      // clamped to the end point, not extended along the infinite line
      expect(service.distanceToLine(new Point(14, 3), horizontal)).toBe(5);
      expect(service.distanceToLine(new Point(-4, 3), horizontal)).toBe(5);
    });

    it("should measure the distance to a diagonal line", () => {
      const diagonal = new Line("line2", 0, 0, 10, 10);
      expect(service.distanceToLine(new Point(10, 0), diagonal)).toBeCloseTo(Math.sqrt(50));
    });

    it("should measure the distance to a line of zero length", () => {
      const point = new Line("line3", 3, 4, 3, 4);
      expect(service.distanceToLine(new Point(0, 0), point)).toBe(5);
    });
  });
});

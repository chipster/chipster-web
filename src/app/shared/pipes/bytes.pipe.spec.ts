import { describe, expect, it } from "vitest";
import { BytesPipe } from "./bytes.pipe";

describe("BytesPipe", () => {
  const pipe = new BytesPipe();
  const mb = 1024 * 1024;

  it("rounds to the given precision", () => {
    expect(pipe.transform(340764)).toBe("332.8 kB");
    expect(pipe.transform(340764, 0)).toBe("333 kB");
    expect(pipe.transform(10 * mb, 0)).toBe("10 MB");
  });

  it("rounds up when asked", () => {
    expect(pipe.transform(10 * mb + 1, 1, true)).toBe("10.1 MB");
    expect(pipe.transform(10 * mb + 1, 1)).toBe("10.0 MB");
    expect(pipe.transform(11 * mb, 1, true)).toBe("11.0 MB");
  });

  it("moves to the next unit when the rounding reaches it", () => {
    expect(pipe.transform(1048575)).toBe("1.0 MB");
    expect(pipe.transform(1048500, 1, true)).toBe("1.0 MB");
    expect(pipe.transform(1023 * mb, 0)).toBe("1023 MB");
  });

  it("handles the special cases", () => {
    expect(pipe.transform(0)).toBe("0 bytes");
    expect(pipe.transform("x")).toBe("-");
  });
});

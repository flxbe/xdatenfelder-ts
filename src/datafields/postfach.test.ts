import { describe, expect, test } from "@jest/globals";
import { Postfach } from "./postfach";

describe("Creating a `Postfach` from a string", () => {
  test("should fail for the empty string", () => {
    expect(() => Postfach.fromString("")).toThrow("Wrong");
  });

  test("should fail for too long values", () => {
    const value = "a".repeat(22);
    expect(() => Postfach.fromString(value)).toThrow("Wrong");
  });

  test("should work for string with the correct length", () => {
    const postfach = Postfach.fromString("test");

    expect(postfach.value).toBe("test");
  });
});

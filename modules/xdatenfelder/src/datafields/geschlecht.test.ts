import { describe, expect, test } from "@jest/globals";
import { Geschlecht } from "./geschlecht";

describe("Creating an instance of `Geschlecht`", () => {
  test("should work for valid values", () => {
    for (const entry of Object.entries(Geschlecht.Variants)) {
      const [value, label] = entry;
      const geschlecht = Geschlecht.fromString(value);

      expect(geschlecht.label).toBe(label);
    }
  });

  test("should fail for invalid values", () => {
    expect(() => Geschlecht.fromString("a")).toThrow("Wrong value");
  });
});

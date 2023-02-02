import { describe, expect, test } from "@jest/globals";
import { Postleitzahl } from "./postleitzahl";

describe("Creating a `Postleitzahl` from a string", () => {
  test.each([["01000"], ["10123"]])("should work for a %s", (value) => {
    const postleitzahl = Postleitzahl.fromString(value);

    expect(postleitzahl.value).toBe(value);
  });

  test.each([["00000"], ["00123"]])("should fail for %s", (value) => {
    expect(() => Postleitzahl.fromString(value)).toThrow("Wrong");
  });
});

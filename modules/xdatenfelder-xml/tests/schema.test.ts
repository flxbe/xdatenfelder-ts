import { open } from "node:fs/promises";
import { describe, expect, test } from "@jest/globals";
import { Schema, SchemaError } from "../src/schema";

describe("Loading a schema from xml", () => {
  test("Should correctly load a schema", async () => {
    const schema = await loadSchema("simple.xml");

    expect(schema.messageId).toEqual("abcd1234");
    expect(schema.createdAt).toEqual(new Date("2020-09-01T00:00:00.000000Z"));
    expect(schema.schemaData).toEqual({
      identifier: "T1234",
      version: "1.0",
      name: "Test",
      description: "Eine Beschreibung",
      definition: "Eine Defintion",
      relatedTo: "Bezug",
      creator: "Test",
      versionInfo: "Ein Versionshinweis",
    });
    expect(schema.dataFields).toHaveLength(0);
  });

  test("should allow undefined fields", async () => {
    const schema = await loadSchema("minimal.xml");

    expect(schema.schemaData).toEqual(
      expect.objectContaining({
        description: undefined,
        definition: undefined,
        relatedTo: undefined,
        versionInfo: undefined,
      })
    );
    expect(schema.dataFields).toHaveLength(0);
  });

  test("should fail for unknown namespace", async () => {
    await expect(loadSchema("unknown-namespace.xml")).rejects.toThrow(
      "Only xDatenfelder v2 is supported."
    );
  });
});

async function loadSchema(name: string): Promise<Schema> {
  const file = await open(`./tests/${name}`, "r");
  const data = await file.readFile({ encoding: "utf-8" });
  await file.close();

  return Schema.fromString(data);
}

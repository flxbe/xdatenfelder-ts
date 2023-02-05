import { open } from "node:fs/promises";
import { describe, expect, test } from "@jest/globals";
import { Schema } from "../src/schema";

describe("Loading a schema from xml", () => {
  test("Should correctly the schema attributes", async () => {
    const schema = await loadTestSchema();

    expect(schema.messageId).toEqual("512D5F8BB9E96947");
    expect(schema.createdAt).toEqual(new Date("2022-09-01T20:04:34.412Z"));
    expect(schema.schemaData).toEqual({
      identifier: "S60000011",
      version: "2.1",
      name: "BOB",
      description: undefined,
      definition:
        "Alle harmoniserten und abstrakten Baukastenelemente des FIM-Bausteins Datenfelder.",
      relatedTo: undefined,
      creator: "FIM-Baustein Datenfelder",
      versionInfo:
        "Erweitert um die Neuerungen der Version 1.1 des Kerndatenmodells von XUnternehmen und weitere kleine Änderungen.",
    });
  });
});

async function loadTestSchema(): Promise<Schema> {
  const file = await open("./tests/test_schema.xml", "r");
  const data = await file.readFile({ encoding: "utf-8" });
  await file.close();

  return Schema.fromString(data);
}

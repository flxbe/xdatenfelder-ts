import { describe, expect, test } from "@jest/globals";
import { serializeSchema, SchemaMessage3 } from "../src";
import { FreigabeStatus, SchemaContainer } from "../src/schema-3";

describe("Serializing a schema", () => {
  test("should return the correct xml string", async () => {
    const container = await loadSchema();

    const xml = serializeSchema(container);
    const message = SchemaMessage3.fromString(xml);

    expect(message.container).toEqual(container);
  });
});

async function loadSchema(): Promise<SchemaContainer> {
  return {
    schema: {
      identifier: "S1:1.2.0",
      id: "S1",
      version: "1.2.0",
      name: "Some Schema",
      label: "Some Label",
      releaseState: FreigabeStatus.FachlichFreigegebenGold,
      lastChangedAt: new Date(),
      rules: [],
      children: [],
      relations: [],
      keywords: [],
      normReferences: [],
    },
    dataGroups: {},
    dataFields: {},
    rules: {},
  };
}

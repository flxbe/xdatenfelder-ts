import { open } from "node:fs/promises";
import { describe, expect, test } from "@jest/globals";
import { FreigabeStatus } from "../src/schema";
import { SchemaMessage } from "../src/messages";

describe("Loading a schema from xml", () => {
  test("should parse a full example", async () => {
    const message = await loadMessage("simple.xml");

    expect(message.schemaContainer.schema).toEqual({
      identifier: "T1234:1.0",
      id: "T1234",
      version: "1.0",
      name: "Test",
      releaseState: FreigabeStatus.Inaktiv,
      description: "Eine Beschreibung",
      definition: "Eine Definition",
      label: "Test",
      children: [],
      keywords: [],
      relations: [],
      rules: [],
      normReferences: [],
      lastChangedAt: new Date(0),
    });
  });

  test("should parse a minimal example", async () => {
    const message = await loadMessage("minimal.xml");

    expect(message.schemaContainer.schema).toEqual({
      identifier: "T1234:1.0",
      id: "T1234",
      version: "1.0",
      name: "Test",
      releaseState: FreigabeStatus.Inaktiv,
      description: undefined,
      definition: undefined,
      label: "Test",
      children: [],
      keywords: [],
      relations: [],
      rules: [],
      normReferences: [],
      lastChangedAt: new Date(0),
    });
  });

  test.todo("should use name if label is undefined");
});

async function loadMessage(name: string): Promise<SchemaMessage> {
  const file = await open(`./tests/v2-data/${name}`, "r");
  const data = await file.readFile({ encoding: "utf-8" });
  await file.close();

  return SchemaMessage.fromV2String(data);
}

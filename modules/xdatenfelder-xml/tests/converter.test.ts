import { open } from "node:fs/promises";
import { describe, expect, test } from "@jest/globals";
import { FreigabeStatus, SchemaElementArt } from "../src/schema";
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
      stateSetAt: new Date("2023-01-01"),
      stateSetBy: "Test",
      publishedAt: new Date("2023-01-01"),
      versionHint: "Ein Versionshinweis",
      children: [
        {
          type: "dataGroup",
          identifier: "G00000082:1.3",
          cardinality: "1:1",
          normReferences: [],
        },
      ],
      keywords: [],
      relations: [],
      rules: [],
      normReferences: [],
      lastChangedAt: new Date(0),
    });

    expect(message.schemaContainer.dataGroups.entries()).toEqual({
      "G00000082:1.3": {
        identifier: "G00000082:1.3",
        id: "G00000082",
        version: "1.3",
        lastChangedAt: new Date(0),
        inputLabel: "Natürliche Person",
        outputLabel: "Natürliche Person",
        description: "Eine Beschreibung",
        definition: "Eine Definition",
        elementType: SchemaElementArt.Abstrakt,
        releaseState: FreigabeStatus.Inaktiv,
        stateSetBy: "FIM Baustein Datenfelder",
        name: "Natürliche Person (abstrakt, umfassend)",
        versionHint: "Versionshinweis",
        rules: [],
        keywords: [],
        relations: [],
        normReferences: [],
        children: [
          {
            type: "dataField",
            identifier: "F60000227:1.1",
            cardinality: "1:1",
            normReferences: [],
          },
        ],
      },
    });

    expect(message.schemaContainer.dataFields.entries()).toEqual({
      "F60000227:1.1": {
        identifier: "F60000227:1.1",
        id: "F60000227",
        version: "1.1",
        lastChangedAt: new Date(0),
        name: "Familienname",
        description: "Eine Beschreibung",
        definition: "Eine Definition",
        inputLabel: "Familienname",
        outputLabel: "Familienname",
        inputHelp: "Hilfe Eingabe",
        outputHelp: "Hilfe Ausgabe",
        elementType: SchemaElementArt.Harmonisiert,
        publishedAt: new Date("2020-11-02"),
        stateSetAt: new Date("2020-11-02"),
        stateSetBy: "FIM-Baustein Datenfelder",
        releaseState: FreigabeStatus.Inaktiv,
        inputType: "input",
        dataType: "text",
        fillType: "keine",
        constraints: {},
        rules: [],
        keywords: [],
        relations: [],
        normReferences: [],
        mediaTypes: [],
        values: [],
      },
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

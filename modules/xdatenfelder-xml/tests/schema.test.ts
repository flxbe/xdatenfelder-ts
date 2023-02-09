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
      steps: ["G00000082"],
    });
    expect(schema.dataGroups).toEqual({
      G00000082: {
        identifier: "G00000082",
        version: "1.3",
        name: "Natürliche Person (abstrakt, umfassend)",
        definition: "Eine Definition",
        description: "Eine Beschreibung",
        bezeichnungEingabe: "Natürliche Person",
        bezeichnungAusgabe: "Natürliche Person",
        creator: "FIM Baustein Datenfelder",
        steps: ["F60000227"],
      },
    });
    expect(schema.dataFields).toEqual({
      F60000227: {
        identifier: "F60000227",
        version: "1.1",
        name: "Familienname",
        description: "Eine Beschreibung",
        definition: "Eine Definition",
        relatedTo: "Ein Bezug",
        bezeichnungEingabe: "Familienname",
        bezeichnungAusgabe: "Familienname",
        hilfetextEingabe: "Hilfe Eingabe",
        hilfetextAusgabe: "Hilfe Ausgabe",
        creator: "FIM-Baustein Datenfelder",
        input: {
          type: "text",
          constraints: {
            minLength: 1,
            maxLength: 120,
            pattern: undefined,
          },
        },
      },
    });
  });

  test("should parse label fields", async () => {
    const schema = await loadSchema("label.xml");

    expect(schema.schemaData.steps).toEqual(["F123"]);
    expect(schema.dataFields["F123"]).toEqual(
      expect.objectContaining({
        identifier: "F123",
        input: {
          type: "label",
          content: "Hinweis Inhalt",
        },
      })
    );
  });

  test("should parse select fields", async () => {
    const schema = await loadSchema("select.xml");

    expect(schema.schemaData.steps).toEqual(["F123"]);
    expect(schema.dataFields["F123"]).toEqual(
      expect.objectContaining({
        identifier: "F123",
        input: {
          type: "select",
          codeListReference: {
            identifier: "C123",
            version: "1",
            canonicalUri: "urn:de:example",
            canonicalVersionUri: "urn:de:example_1",
          },
        },
      })
    );
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
    expect(schema.dataFields).toEqual({});
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

import { open } from "node:fs/promises";
import { describe, expect, test } from "@jest/globals";
import { Schema } from "../src/schema";
import { FastSchemaParser } from "../src";

describe("Loading a schema from xml", () => {
  test("Should correctly load the schema", async () => {
    const schema = await loadSchema("simple.xml");

    expect(schema.messageId).toEqual("abcd1234");
    expect(schema.createdAt).toEqual(new Date("2020-09-01T00:00:00.000000Z"));
    expect(schema.schemaData).toEqual({
      identifier: "T1234",
      version: "1.0",
      name: "Test",
      inputLabel: "Test",
      outputLabel: undefined,
      description: "Eine Beschreibung",
      definition: "Eine Defintion",
      relatedTo: "Bezug",
      creator: "Test",
      versionInfo: "Ein Versionshinweis",
      rules: [],
      elements: [{ type: "dataGroup", identifier: "G00000082" }],
    });
    expect(schema.dataGroups).toEqual({
      G00000082: {
        identifier: "G00000082",
        version: "1.3",
        name: "Natürliche Person (abstrakt, umfassend)",
        definition: "Eine Definition",
        description: "Eine Beschreibung",
        inputLabel: "Natürliche Person",
        outputLabel: "Natürliche Person",
        creator: "FIM Baustein Datenfelder",
        versionInfo: "Versionshinweis",
        rules: [],
        elements: [{ type: "dataField", identifier: "F60000227" }],
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
        inputLabel: "Familienname",
        outputLabel: "Familienname",
        inputHint: "Hilfe Eingabe",
        outputHint: "Hilfe Ausgabe",
        creator: "FIM-Baustein Datenfelder",
        rules: [],
        input: {
          type: "text",
          content: undefined,
          constraints: '{"minLength":"1","maxLength":"120"}',
        },
      },
    });
    expect(schema.rules).toEqual({});
  });

  test("should fail for duplicate values", async () => {
    await expect(loadSchema("duplicate-value.xml")).rejects.toThrow(
      "Duplicate <xdf:name>"
    );
  });

  test("should parse label fields", async () => {
    const schema = await loadSchema("label.xml");

    expect(schema.schemaData.elements).toEqual([
      { type: "dataField", identifier: "F123" },
    ]);
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

    expect(schema.schemaData.elements).toEqual([
      { type: "dataField", identifier: "F123" },
    ]);
    expect(schema.dataFields["F123"]).toEqual(
      expect.objectContaining({
        identifier: "F123",
        input: {
          type: "select",
          content: undefined,
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

  test("should parse schema rules", async () => {
    const schema = await loadSchema("rule.xml");

    expect(schema.rules).toEqual({
      R60000037: {
        identifier: "R60000037",
        version: "1.2",
        name: "MindestEineAngabe",
        inputLabel: "MindestEineAngabe",
        outputLabel: undefined,
        creator: "Bundesredaktion",
        definition: "Eine Definition",
        description: undefined,
        relatedTo: undefined,
        script: "function script() {}",
        versionInfo: undefined,
      },
    });

    expect(schema.schemaData.rules).toEqual(["R60000037"]);
  });

  test("should parse data field rules", async () => {
    const schema = await loadSchema("data-field-rule.xml");

    expect(schema.rules).toEqual({
      R60000037: {
        identifier: "R60000037",
        version: "1.2",
        name: "MindestEineAngabe",
        inputLabel: "MindestEineAngabe",
        outputLabel: undefined,
        creator: "Bundesredaktion",
        definition: "Eine Definition",
        description: undefined,
        relatedTo: undefined,
        script: "function script() {}",
        versionInfo: undefined,
      },
    });

    expect(schema.getDataField("F123").rules).toEqual(["R60000037"]);
  });

  test("should parse data group rules", async () => {
    const schema = await loadSchema("data-group-rule.xml");

    expect(schema.rules).toEqual({
      R60000037: {
        identifier: "R60000037",
        version: "1.2",
        name: "MindestEineAngabe",
        inputLabel: "MindestEineAngabe",
        outputLabel: undefined,
        creator: "Bundesredaktion",
        definition: "Eine Definition",
        description: undefined,
        relatedTo: undefined,
        script: "function script() {}",
        versionInfo: undefined,
      },
    });

    expect(schema.getDataGroup("G00000082").rules).toEqual(["R60000037"]);
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

  test.skip("should fail for unknown namespace", async () => {
    await expect(loadSchema("unknown-namespace.xml")).rejects.toThrow(
      "Only xDatenfelder v2 is supported."
    );
  });
});

async function loadSchema(name: string): Promise<Schema> {
  const file = await open(`./tests/v2-data/${name}`, "r");
  const data = await file.readFile({ encoding: "utf-8" });
  await file.close();

  return FastSchemaParser.parseString(data).schema;
}

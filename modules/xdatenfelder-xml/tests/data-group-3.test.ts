import { open } from "node:fs/promises";
import { describe, expect, test } from "@jest/globals";
import { DataGroupMessage3 } from "../src";

describe("Loading a schema from xml", () => {
  test("Should correctly load the schema", async () => {
    const message = await loadMessage("simple.xml");

    expect(message.id).toEqual("65FD4FCC3C8D77FC");
    expect(message.createdAt).toEqual(new Date("2021-04-14T12:49:54.848Z"));

    expect(message.rootDataGroup).toEqual("G60000000088");
    expect(message.dataGroups).toEqual({
      G60000000088: {
        identifier: "G60000000088",
        version: "1.2.0",
        name: "Anschrift Inland",
        description: "Eine Beschreibung",
        definition: "Eine Definition",
        releaseState: "6",
        rules: ["R60000000019"],
        children: [
          { type: "dataGroup", identifier: "G60000000086" },
          { type: "dataGroup", identifier: "G60000000087" },
        ],
      },
      G60000000086: {
        identifier: "G60000000086",
        version: "1.2.0",
        name: "Anschrift Inland Straßenanschrift",
        description: undefined,
        definition: undefined,
        releaseState: "6",
        rules: [],
        children: [],
      },
      G60000000087: {
        identifier: "G60000000087",
        version: "1.1.0",
        name: "Anschrift Inland Postfachanschrift",
        description: undefined,
        definition:
          "Postfachanschrift im Inland mit Postfach(nummer), PLZ und Ort.",
        releaseState: "6",
        rules: [],
        children: [],
      },
    });
    expect(message.dataFields).toEqual({});
    expect(message.rules).toEqual({
      R60000000019: {
        identifier: "R60000000019",
        version: "1.2.0",
        name: "Anschrift Inland Straßenanschrift / Anschrift Inland Postfachanschrift",
        description: "Eine Regelbeschreibung",
      },
    });
  });
});

async function loadMessage(name: string): Promise<DataGroupMessage3> {
  const file = await open(`./tests/v3-data/${name}`, "r");
  const data = await file.readFile({ encoding: "utf-8" });
  await file.close();

  return DataGroupMessage3.fromString(data);
}

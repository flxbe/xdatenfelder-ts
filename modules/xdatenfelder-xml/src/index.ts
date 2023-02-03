import { open, readdir } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";
import assert from "node:assert/strict";
import prettier from "prettier";

class XmlArray {
  private data: Array<any>;

  constructor(data: Array<any>) {
    this.data = data;
  }

  public asXmlData(): Array<XmlData> {
    return this.data.map((item) => {
      if (item === undefined) {
        throw `Child with key ${item} does not exist`;
      } else if (typeof item !== "object") {
        throw `Type of child is ${typeof item}, not "object"`;
      }

      return new XmlData(item);
    });
  }

  public print(): void {
    console.log(this.data);
  }
}

class XmlData {
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  public static async loadFromFile(filepath: string): Promise<XmlData> {
    const file = await open(filepath, "r");
    const content = await file.readFile("utf-8");
    file.close();

    const parser = new XMLParser({
      numberParseOptions: {
        leadingZeros: false,
        hex: false,
        skipLike: /^\d+$/,
      },
    });
    const data = parser.parse(content);

    return new XmlData(data);
  }

  public getChild(key: string): XmlData {
    const child = this.data[key];

    if (child === undefined) {
      throw `Child with key ${key} does not exist`;
    } else if (typeof child !== "object") {
      throw `Type of child is ${typeof child}, not "object"`;
    }

    return new XmlData(child);
  }

  public getString(key: string): string {
    const child = this.data[key];

    if (typeof child !== "string") {
      throw `Type of ${key} is ${typeof child}, expected string`;
    } else {
      return child;
    }
  }

  public getArray(key: string): XmlArray {
    const child = this.data[key];

    if (!Array.isArray(child)) {
      throw `Item ${key} is not an array, got: ${child}`;
    } else {
      return new XmlArray(child);
    }
  }

  public print(): void {
    console.log(this.data);
  }
}

const IDENTIFIER_TO_LABEL: Record<string, string> = {
  C60000001: "Familienstand",
  C60000006: "AnschriftInlandOderAusland",
  C60000008: "Identifikationsdokumente",
  C60000009: "Verwandtschaftsverhaeltnis",
  C60000010: "GesetzlicherVertreter",
  C60000014: "Bundesland",
  C60000018: "Geschlecht",
  C60000019: "Staatsangehoerigkeit",
  C60000020: "Staat",
  C60000023: "ArtGesellschafterPersonengesellschaft",
  C60000025: "RechtsformGaengig",
  C60000027: "Registergerichte",
  C60000028: "IndustrieUndHandelskammer",
  C60000029: "Handwerkskammer",
  C60000030: "GesetzlicherVertreterBevollmaechtigter",
  C60000031: "Augenfarbe",
  C60000035: "ArtNiederlassung",
  C60000036: "ArtAnschrift",
  C60000037: "klassifikationKommunikation",
  C60000038: "ArtEintragung",
  C60000040: "ArtGesetzlicherVertreter",
  C60000042: "Rechtsform",
};

class CodeListItem {
  public code: string;
  public label: string;

  constructor(code: string, label: string) {
    this.code = code;
    this.label = label;
  }
}

class CodeList {
  public identifier: string;

  public shortName: string;
  public longName: string;
  public version: string;
  public canonicalUri: string;
  public canonicalVersionUri: string;

  public items: Array<CodeListItem>;

  constructor(
    identifier: string,
    shortName: string,
    longName: string,
    version: string,
    canonicalUri: string,
    canonicalVersionUri: string,
    items: Array<CodeListItem>
  ) {
    this.identifier = identifier;

    this.shortName = shortName;
    this.longName = longName;
    this.version = version;
    this.canonicalUri = canonicalUri;
    this.canonicalVersionUri = canonicalVersionUri;

    this.items = items;
  }

  public static async loadFromFile(
    filepath: string,
    identifier: string
  ): Promise<CodeList> {
    const data = await XmlData.loadFromFile(filepath);

    const codeList = data.getChild("CodeList");
    const identification = codeList.getChild("Identification");
    const shortName = identification.getString("ShortName");
    const longName = identification.getString("LongName");
    const version = identification.getString("Version");
    const canonicalUri = identification.getString("CanonicalUri");
    const canonicalVersionUri = identification.getString("CanonicalVersionUri");

    // identification.print();
    // codeList.getChild("SimpleCodeList").print();
    // codeList.print();

    const items = codeList
      .getChild("SimpleCodeList")
      .getArray("Row")
      .asXmlData()
      .map((row) => {
        const values = row.getArray("Value").asXmlData();
        assert(values.length >= 2);

        const [codeData, labelData, ..._] = values;
        assert(codeData !== undefined);
        assert(labelData !== undefined);

        const code = codeData.getString("SimpleValue");
        const label = labelData.getString("SimpleValue");

        return new CodeListItem(code, label);
      });

    return new CodeList(
      identifier,
      shortName,
      longName,
      version,
      canonicalUri,
      canonicalVersionUri,
      items
    );
  }
}

const files = await readdir("./data/codelists");

const codeLists = await Promise.all(
  files.map((filename) => {
    const identifier = filename.split("_")[0];
    assert(identifier !== undefined);

    return CodeList.loadFromFile(`./data/codelists/${filename}`, identifier);
  })
);

for (const list of codeLists) {
  console.log(list.identifier, IDENTIFIER_TO_LABEL[list.identifier]);

  const label = IDENTIFIER_TO_LABEL[list.identifier];
  assert(label !== undefined);

  let raw = "";

  raw += `export const MetaData = {
    id: "${list.identifier}",
    version: "${list.version}",
    canonicalUri: "${list.canonicalUri}",
    canonicalVersionUri: "${list.canonicalVersionUri}",
    longName: "${list.longName}",
    shortName: "${list.shortName}",
  }\n\n`;

  raw += `export type Value = ${list.items
    .map((item) => `"${item.code}"`)
    .join(" | ")};\n\n`;

  raw += `export const Variants: Record<Value, string> = {\n ${list.items
    .map((item) => `"${item.code}": "${item.label}"`)
    .join(",")} };\n\n`;

  const formatted = prettier.format(raw, { parser: "typescript" });

  const filename = `${toKebabCase(label)}.ts`;
  const file = await open(`../xdatenfelder/src/codelists/${filename}`, "w");
  await file.write(formatted);
  file.close();
}

function toKebabCase(value: string): string {
  return (
    value
      .trim()
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/\W/g, (m) => (/[À-ž]/.test(m) ? m : "-"))
      .replace(/^-+|-+$/g, "")
      // .replace(/-{2,}/g, m => options && options.condense ? '-' : m)
      .toLowerCase()
  );
}

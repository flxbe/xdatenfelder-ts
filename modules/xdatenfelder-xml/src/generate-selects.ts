import { open } from "node:fs/promises";
import assert from "node:assert/strict";
import prettier from "prettier";
import { XmlData } from "./xml";
import {
  DATA_FIELD_IDENTIFIER_TO_LABEL,
  CODE_LIST_IDENTIFIER_TO_LABEL,
  toKebabCase,
} from "./util";

export interface CodeListReference {
  identifier: string;
  version: string;
  canonicalUri: string;
  canonicalVersionUri: string;
}

export interface DataField {
  identifier: string;
  version: string;
  name: string;
  definition: string;
  bezeichnungEingabe: string;
  bezeichnungAusgabe: string;
  hilfetextEingabe: string;
  hilfetextAusgabe: string;
  type: string;
  codeListReference: CodeListReference | undefined;
}

export class Data {
  public dataFields: Array<DataField>;

  constructor(dataFields: Array<DataField>) {
    this.dataFields = dataFields;
  }

  public static async loadFromFile(filepath: string): Promise<Data> {
    const data = await XmlData.loadFromFile(filepath);

    const schema = data
      .getChild("xdf:xdatenfelder.stammdatenschema.0102")
      .getChild("xdf:stammdatenschema");

    const structs = schema.getArray("xdf:struktur").asXmlData();

    const dataFields: Record<string, DataField> = {};
    collectDataFields(structs, dataFields);

    return new Data(Object.values(dataFields));
  }

  public get selectFields(): Array<DataField> {
    return this.dataFields.filter((dataField) => dataField.type === "select");
  }
}

function collectDataFields(
  structs: Array<XmlData>,
  dataFields: Record<string, DataField>
): void {
  for (const struct of structs) {
    const content = struct.getChild("xdf:enthaelt");

    if (content.hasChild("xdf:datenfeldgruppe")) {
      const group = content.getChild("xdf:datenfeldgruppe");

      // If there is only one child in `xdf:structur`, the data is flattened to only contain
      // the single child instead of an array with length 1.
      try {
        collectDataFields(
          group.getArray("xdf:struktur").asXmlData(),
          dataFields
        );
      } catch (error) {
        collectDataFields([group.getChild("xdf:struktur")], dataFields);
      }
    } else if (content.hasChild("xdf:datenfeld")) {
      const data = content.getChild("xdf:datenfeld");
      const dataField = parseDataField(data);

      dataFields[dataField.identifier] = dataField;
    } else {
      content.print();
      throw "Unknown content";
    }
  }
}

function parseDataField(data: XmlData): DataField {
  const identification = data.getChild("xdf:identifikation");
  const identifier = identification.getString("xdf:id");
  const version = identification.getString("xdf:version");

  const name = data.getString("xdf:name");
  const bezeichnungEingabe = data.getString("xdf:bezeichnungEingabe");
  const bezeichnungAusgabe = data.getString("xdf:bezeichnungAusgabe");
  const definition = data.getString("xdf:definition");
  const type = data.getChild("xdf:feldart").getString("code");
  const hilfetextEingabe = data.getString("xdf:hilfetextEingabe");
  const hilfetextAusgabe = data.getString("xdf:hilfetextAusgabe");

  let codeListReference: CodeListReference | undefined = undefined;
  if (type === "select") {
    codeListReference = parseCodeListReference(data);
  }

  return {
    identifier,
    version,
    name,
    definition,
    bezeichnungEingabe,
    bezeichnungAusgabe,
    hilfetextEingabe,
    hilfetextAusgabe,
    type,
    codeListReference,
  };
}

function parseCodeListReference(data: XmlData): CodeListReference {
  const referenceData = data.getChild("xdf:codelisteReferenz");
  const identifier = referenceData
    .getChild("xdf:identifikation")
    .getString("xdf:id");

  const identification = referenceData.getChild("xdf:genericodeIdentification");
  const canonicalUri = identification.getString("xdf:canonicalIdentification");
  const version = identification.getString("xdf:version");
  const canonicalVersionUri = identification.getString(
    "xdf:canonicalVersionUri"
  );

  return {
    identifier,
    version,
    canonicalUri,
    canonicalVersionUri,
  };
}

const data = await Data.loadFromFile("./data/S60000011V2.1_xdf2.xml");

for (const select of data.selectFields) {
  const label = DATA_FIELD_IDENTIFIER_TO_LABEL[select.identifier];
  assert(label);

  assert(select.codeListReference);
  const codeListLabel =
    CODE_LIST_IDENTIFIER_TO_LABEL[select.codeListReference.identifier];
  assert(codeListLabel);

  let raw = "";

  raw += `
  import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
  import { ${codeListLabel}Value, ${codeListLabel}Variants, ${codeListLabel}MetaData } from "../codelists/${toKebabCase(
    codeListLabel
  )}";
  
  export class ${label} extends SelectDataField<${codeListLabel}Value> {
    public static Variants = ${codeListLabel}Variants;
  
    public static Meta: DataFieldMetaData = {
      id: ${_str(select.identifier)},
      version: ${_str(select.version)},
      name: ${_str(select.name)},
      bezeichnungEingabe: ${_str(select.bezeichnungEingabe)},
      bezeichnungAusgabe: ${_str(select.bezeichnungAusgabe)},
      hilfetextEingabe: ${_str(select.hilfetextEingabe)},
      hilfetextAusgabe: ${_str(select.bezeichnungAusgabe)}
    };
  
    public static CodeListMeta: CodeListMetaData = ${codeListLabel}MetaData;
  
    constructor(value: ${codeListLabel}Value) {
      super(value, ${label}.Variants);
    }
  
    public static fromString(value: string): ${label} {
      if (${label}.isValid(value)) {
        return new ${label}(value);
      }
  
      throw "Wrong value";
    }
  
    public static isValid(value: string): value is ${codeListLabel}Value {
      return value in ${label}.Variants;
    }
  }
  `;

  const formatted = prettier.format(raw, { parser: "typescript" });

  const filename = `${toKebabCase(label)}.ts`;
  const file = await open(`../xdatenfelder/src/selects/${filename}`, "w");
  await file.write(formatted);
  file.close();
}

const indexContent = prettier.format(
  data.selectFields
    .map((select) => {
      const label = DATA_FIELD_IDENTIFIER_TO_LABEL[select.identifier];
      assert(label);

      return `export * from "./${toKebabCase(label)}"`;
    })
    .join("\n"),
  { parser: "typescript" }
);

const file = await open("../xdatenfelder/src/selects/index.ts", "w");
await file.write(indexContent);
file.close();

function _str(value: string | undefined): string {
  if (value) {
    return `${JSON.stringify(value)}`;
  } else {
    return "undefined";
  }
}

for (const input of data.dataFields) {
  console.log(input.identifier, input.name);
}

import { open } from "node:fs/promises";
import assert from "node:assert/strict";
import prettier from "prettier";
import {
  DATA_FIELD_IDENTIFIER_TO_LABEL,
  CODE_LIST_IDENTIFIER_TO_LABEL,
  toKebabCase,
  readFile,
} from "./util";
import { Schema } from "xdatenfelder-xml";

const content = await readFile("./data/S60000011V2.1_xdf2.xml");
const data = await Schema.fromString(content);

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

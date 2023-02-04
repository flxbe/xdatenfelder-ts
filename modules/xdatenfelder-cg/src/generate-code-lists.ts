import { open, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import prettier from "prettier";
import { CodeList } from "xdatenfelder-xml";
import { CODE_LIST_IDENTIFIER_TO_LABEL, readFile, toKebabCase } from "./util";

const files = await readdir("./data/codelists");

const codeLists = await Promise.all(
  files.map(async (filename) => {
    const identifier = filename.split("_")[0];
    assert(identifier !== undefined);

    const filepath = `./data/codelists/${filename}`;
    const data = await readFile(filepath);

    return CodeList.fromString(data, identifier);
  })
);

for (const list of codeLists) {
  console.log(list.identifier, CODE_LIST_IDENTIFIER_TO_LABEL[list.identifier]);

  const label = CODE_LIST_IDENTIFIER_TO_LABEL[list.identifier];
  assert(label !== undefined);

  let raw = "";

  raw += `export const ${label}MetaData = {
    id: "${list.identifier}",
    version: "${list.version}",
    canonicalUri: "${list.canonicalUri}",
    canonicalVersionUri: "${list.canonicalVersionUri}",
    longName: "${list.longName}",
    shortName: "${list.shortName}",
  }\n\n`;

  raw += `export type ${label}Value = ${list.items
    .map((item) => `"${item.code}"`)
    .join(" | ")};\n\n`;

  raw += `export const ${label}Variants: Record<${label}Value, string> = {\n ${list.items
    .map((item) => `"${item.code}": "${item.label}"`)
    .join(",")} };\n\n`;

  const formatted = prettier.format(raw, { parser: "typescript" });

  const filename = `${toKebabCase(label)}.ts`;
  const file = await open(`../xdatenfelder/src/codelists/${filename}`, "w");
  await file.write(formatted);
  file.close();
}

const indexContent = prettier.format(
  codeLists
    .map((list) => {
      const label = CODE_LIST_IDENTIFIER_TO_LABEL[list.identifier];
      assert(label);

      return `export * from "./${toKebabCase(label)}"`;
    })
    .join("\n"),
  { parser: "typescript" }
);

const file = await open("../xdatenfelder/src/codelists/index.ts", "w");
await file.write(indexContent);
file.close();

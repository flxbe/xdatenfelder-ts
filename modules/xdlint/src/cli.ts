import { program } from "commander";
import { SchemaMessage } from "xdatenfelder-xml/src/v2";
import { open } from "node:fs";
import { resolve } from "node:path";

program
  .name("xdlint")
  .description("A linter for XDatenfelder v2.0.")
  .version("0.1.0")
  .argument("<path>", "Path to a XDatenfelder .xml file")
  .action((path) => {
    const absolutePath = resolve(process.cwd(), path);
    console.log(absolutePath);
  });

program.parse();

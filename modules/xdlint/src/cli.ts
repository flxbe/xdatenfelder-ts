import { program } from "commander";
import {
  SchemaMessage,
  SchemaWarnings,
  Warning,
} from "xdatenfelder-xml/src/v2";
import { open, readdir, stat } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";
import chalk from "chalk";
import { exit } from "node:process";
import { ParserError } from "xdatenfelder-xml/src/errors";

function collectWarnings(warnings: SchemaWarnings): Warning[] {
  const list: Warning[] = [];

  for (const warning of warnings.schemaWarnings) {
    list.push(warning);
  }

  for (const elementWarnings of Object.values(warnings.dataFieldWarnings)) {
    for (const warning of elementWarnings) {
      list.push(warning);
    }
  }

  for (const elementWarnings of Object.values(warnings.dataGroupWarnings)) {
    for (const warning of elementWarnings) {
      list.push(warning);
    }
  }

  for (const elementWarnings of Object.values(warnings.ruleWarnings)) {
    for (const warning of elementWarnings) {
      list.push(warning);
    }
  }

  return list;
}

function warningToString(warning: Warning): string {
  let message;

  switch (warning.type) {
    case "invalidInputConstraints":
      {
        message = `Invalid value for <praezisierung>: ${warning.value}`;
      }
      break;
    case "missingAttribute":
      {
        message = `${chalk.grey("Missing attribute")} ${warning.attribute}`;
      }
      break;

    default:
      throw new Error("Unknown warning");
  }

  return `${warning.identifier} ${chalk.yellow("Warning")} - ${message}`;
}

async function checkFile(filepath: string): Promise<{
  numWarnings: number;
  numErrors: number;
}> {
  const file = await open(filepath, "r");
  const relativePath = relative(process.cwd(), filepath);

  let data;
  try {
    data = await file.readFile({ encoding: "utf-8" });
  } finally {
    await file.close();
  }

  try {
    const { warnings } = SchemaMessage.fromString(data);
    const warningsList = collectWarnings(warnings);

    for (const warning of warningsList) {
      console.warn(`${relativePath}:`, warningToString(warning));
    }

    return { numErrors: 0, numWarnings: warningsList.length };
  } catch (error: unknown) {
    if (error instanceof ParserError) {
      console.error(`${relativePath}:`, chalk.red("error"), "-", error.message);
      return { numErrors: 1, numWarnings: 0 };
    } else {
      throw error;
    }
  } finally {
    await file.close();
  }
}

program
  .name("xdlint")
  .description("A linter for XDatenfelder v2.0.")
  .version("0.1.0")
  .option("-s, --strict", "Fail if there are warnings.")
  .argument("<path>", "Path to a folder or a XDatenfelder .xml file")
  .action(async (path, options) => {
    const absolutePath = resolve(process.cwd(), path);

    let totalErrors = 0;
    let totalWarnings = 0;

    const stats = await stat(absolutePath);

    let filepaths: string[] = [];
    if (stats.isDirectory()) {
      const files = await readdir(absolutePath);
      for (const file of files) {
        const extension = extname(file);
        if (extension === ".xml") {
          filepaths.push(resolve(absolutePath, file));
        }
      }
    } else {
      filepaths = [absolutePath];
    }

    for (const filepath of filepaths) {
      const { numErrors, numWarnings } = await checkFile(filepath);
      totalErrors += numErrors;
      totalWarnings += numWarnings;
    }

    console.info(
      chalk.grey("Found"),
      chalk.white(totalWarnings),
      chalk.yellow("warning(s)"),
      chalk.grey("and"),
      chalk.white(totalErrors),
      chalk.red("error(s).")
    );

    if (totalErrors > 0) {
      exit(-1);
    } else if (options["strict"] && totalWarnings > 0) {
      exit(-1);
    }
  });

program.parse();

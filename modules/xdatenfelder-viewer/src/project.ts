import {
  SchemaContainer,
  SchemaMessage,
  SchemaWarnings,
} from "xdatenfelder-xml/src/v2";

export class Project {
  public readonly container: SchemaContainer;
  public readonly warnings: SchemaWarnings;

  constructor(container: SchemaContainer, warnings: SchemaWarnings) {
    this.container = container;
    this.warnings = warnings;
  }

  public static fromSchemaMessage(
    message: SchemaMessage,
    warnings: SchemaWarnings
  ): Project {
    return new Project(message.schemaContainer, warnings);
  }
}

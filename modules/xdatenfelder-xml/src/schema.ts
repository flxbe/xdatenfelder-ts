import { assert } from "./util";
import { XmlData } from "./xml";

export interface CodeListReference {
  identifier: string;
  version: string;
  canonicalUri: string;
  canonicalVersionUri: string;
}

interface InputConstraints {
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface NumberConstraints {
  minValue?: number;
  maxValue?: number;
}

export interface TextConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface SelectDescription {
  type: "select";
  codeListReference: CodeListReference;
}

export interface TextDescription {
  type: "text";
  constraints: TextConstraints;
}

export interface IntegerDescription {
  type: "integer";
  constraints: NumberConstraints;
}

export interface LabelDescription {
  type: "label";
  content: string;
}

export interface BoolDescription {
  type: "bool";
}

export interface FileDescription {
  type: "file";
}

export interface DateDescription {
  type: "date";
}

export interface NumberDescription {
  type: "number";
  constraints: NumberConstraints;
}

export interface CurrencyDescription {
  type: "currency";
  constraints: NumberConstraints;
}

export interface ObjectDescription {
  type: "object";
}

export type InputDescription =
  | SelectDescription
  | TextDescription
  | IntegerDescription
  | BoolDescription
  | FileDescription
  | DateDescription
  | NumberDescription
  | CurrencyDescription
  | ObjectDescription
  | LabelDescription;

export interface DataField {
  identifier: string;
  version: string;
  name: string;
  definition?: string;
  relatedTo?: string;
  creator: string;
  description?: string;
  bezeichnungEingabe: string;
  bezeichnungAusgabe: string;
  hilfetextEingabe?: string;
  hilfetextAusgabe?: string;
  input: InputDescription;
}

export interface DataGroup {
  identifier: string;
  version: string;
  name: string;
  definition?: string;
  description?: string;
  bezeichnungEingabe?: string;
  bezeichnungAusgabe?: string;
  creator: string;
  steps: Array<string>;
}

export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaError";
  }
}

interface SchemaData {
  identifier: string;
  version: string;
  name: string;
  definition?: string;
  description?: string;
  relatedTo?: string;
  creator: string;
  versionInfo?: string;
  steps: Array<string>;
}

export interface InvalidInputConstraints {
  type: "invalidInputConstraints";
  identifier: string;
  value: string;
}

export type Warning = InvalidInputConstraints;

export class Schema {
  public readonly messageId: string;
  public readonly createdAt: Date;
  public readonly schemaData: SchemaData;
  public readonly dataFields: Record<string, DataField>;
  public readonly dataGroups: Record<string, DataGroup>;
  public readonly warnings: Array<Warning>;

  constructor(
    messageId: string,
    createdAt: Date,
    schemaData: SchemaData,
    dataFields: Record<string, DataField>,
    dataGroups: Record<string, DataGroup>,
    warnings: Array<Warning>
  ) {
    this.messageId = messageId;
    this.createdAt = createdAt;
    this.schemaData = schemaData;
    this.dataFields = dataFields;
    this.dataGroups = dataGroups;
    this.warnings = warnings;
  }

  public static fromString(stringData: string): Schema {
    return new SchemaParser().parseSchema(stringData);
  }

  public get selectFields(): Array<DataField> {
    return Object.values(this.dataFields).filter(
      (dataField) => dataField.input.type === "select"
    );
  }

  public get codeListReferences(): Array<CodeListReference> {
    const references: Array<CodeListReference> = [];
    for (const dataField of Object.values(this.dataFields)) {
      if (dataField.input.type === "select") {
        references.push(dataField.input.codeListReference);
      }
    }

    return references;
  }
}

class SchemaParser {
  private warnings: Array<Warning> = [];

  public parseSchema(stringData: string): Schema {
    const data = XmlData.fromString(stringData);

    const content = data.getChild("xdf:xdatenfelder.stammdatenschema.0102");
    const namespace = content.getString("@_xmlns:xdf");
    if (namespace !== "urn:xoev-de:fim:standard:xdatenfelder_2") {
      throw new SchemaError("Only xDatenfelder v2 is supported.");
    }

    const header = content.getChild("xdf:header");
    const messageId = header.getString("xdf:nachrichtID");
    const createdAt = header.getDate("xdf:erstellungszeitpunkt");

    const schema = content.getChild("xdf:stammdatenschema");

    const identification = schema.getChild("xdf:identifikation");
    const identifier = identification.getString("xdf:id");
    const version = identification.getString("xdf:version");
    const name = schema.getString("xdf:name");
    const description = schema.getOptionalString("xdf:beschreibung");
    const definition = schema.getOptionalString("xdf:definition");
    const relatedTo = schema.getOptionalString("xdf:bezug");
    const creator = schema.getString("xdf:fachlicherErsteller");
    const versionInfo = schema.getOptionalString("xdf:versionshinweis");

    const structs = schema.getArray("xdf:struktur").asXmlData();

    const dataFields: Record<string, DataField> = {};
    const dataGroups: Record<string, DataGroup> = {};
    const steps = this.collectStructs(structs, dataFields, dataGroups);

    return new Schema(
      messageId,
      createdAt,
      {
        identifier,
        version,
        name,
        description,
        relatedTo,
        definition,
        creator,
        versionInfo,
        steps,
      },
      dataFields,
      dataGroups,
      this.warnings
    );
  }

  private collectStructs(
    structs: Array<XmlData>,
    dataFields: Record<string, DataField>,
    dataGroups: Record<string, DataGroup>
  ): Array<string> {
    const steps: Array<string> = [];

    for (const struct of structs) {
      const content = struct.getChild("xdf:enthaelt");

      if (content.hasKey("xdf:datenfeldgruppe")) {
        const data = content.getChild("xdf:datenfeldgruppe");
        const group = this.parseDataGroup(data, dataFields, dataGroups);

        steps.push(group.identifier);
        dataGroups[group.identifier] = group;
      } else if (content.hasKey("xdf:datenfeld")) {
        const data = content.getChild("xdf:datenfeld");
        const dataField = this.parseDataField(data);

        steps.push(dataField.identifier);
        dataFields[dataField.identifier] = dataField;
      } else {
        content.print();
        throw "Unknown content";
      }
    }

    return steps;
  }

  private parseDataGroup(
    data: XmlData,
    dataFields: Record<string, DataField>,
    dataGroups: Record<string, DataGroup>
  ): DataGroup {
    const identification = data.getChild("xdf:identifikation");
    const identifier = identification.getString("xdf:id");
    const version = identification.getString("xdf:version");

    const name = data.getString("xdf:name");
    const definition = data.getOptionalString("xdf:definition");
    const description = data.getOptionalString("xdf:beschreibung");
    const creator = data.getString("xdf:fachlicherErsteller");
    const bezeichnungEingabe = data.getOptionalString("xdf:bezeichnungEingabe");
    const bezeichnungAusgabe = data.getOptionalString("xdf:bezeichnungAusgabe");

    const structs = data.getArray("xdf:struktur").asXmlData();
    const steps = this.collectStructs(structs, dataFields, dataGroups);

    return {
      identifier,
      version,
      name,
      creator,
      definition,
      description,
      bezeichnungEingabe,
      bezeichnungAusgabe,
      steps,
    };
  }

  private parseDataField(data: XmlData): DataField {
    const identification = data.getChild("xdf:identifikation");
    const identifier = identification.getString("xdf:id");
    const version = identification.getString("xdf:version");

    const name = data.getString("xdf:name");
    const definition = data.getOptionalString("xdf:definition");
    const creator = data.getString("xdf:fachlicherErsteller");
    const relatedTo = data.getOptionalString("xdf:bezug");
    const description = data.getOptionalString("xdf:beschreibung");
    const bezeichnungEingabe = data.getString("xdf:bezeichnungEingabe");
    const bezeichnungAusgabe = data.getString("xdf:bezeichnungAusgabe");
    const hilfetextEingabe = data.getOptionalString("xdf:hilfetextEingabe");
    const hilfetextAusgabe = data.getOptionalString("xdf:hilfetextAusgabe");

    const input = this.parseInputDescription(identifier, data);

    return {
      identifier,
      version,
      name,
      definition,
      creator,
      relatedTo,
      description,
      bezeichnungEingabe,
      bezeichnungAusgabe,
      hilfetextEingabe,
      hilfetextAusgabe,
      input,
    };
  }

  private parseInputDescription(
    identifier: string,
    data: XmlData
  ): InputDescription {
    const type = data.getChild("xdf:feldart").getString("code");
    const dataType = data.getChild("xdf:datentyp").getString("code");

    switch (type) {
      case "select": {
        // TODO: assert(dataType === "text"), or log warning
        // TODO: Check for unused input constraints, like content or praezisierung.
        const codeListReference = this.parseCodeListReference(data);

        return {
          type: "select",
          codeListReference,
        };
      }

      case "input": {
        const constraints = data.getOptionalString("xdf:praezisierung");
        const inputConstraints = this.parseConstraints(identifier, constraints);

        switch (dataType) {
          case "text": {
            return {
              type: "text",
              constraints: {
                minLength: inputConstraints?.minLength,
                maxLength: inputConstraints?.maxLength,
                pattern: inputConstraints?.pattern,
              },
            };
          }

          case "bool": {
            return { type: "bool" };
          }

          case "num_int": {
            return {
              type: "integer",
              constraints: {
                minValue: inputConstraints?.minLength,
                maxValue: inputConstraints?.maxValue,
              },
            };
          }

          case "date": {
            return { type: "date" };
          }

          case "num": {
            return {
              type: "number",
              constraints: {
                minValue: inputConstraints?.minLength,
                maxValue: inputConstraints?.maxValue,
              },
            };
          }

          case "num_currency": {
            return {
              type: "currency",
              constraints: {
                minValue: inputConstraints?.minLength,
                maxValue: inputConstraints?.maxValue,
              },
            };
          }

          case "file": {
            return { type: "file" };
          }

          case "obj": {
            return { type: "object" };
          }

          default: {
            throw new Error(
              `Unknown data type for data field ${identifier}: ${dataType}`
            );
          }
        }
      }

      case "label": {
        // TODO: assert(dataType === "text"), or log warning

        const content = data.getOptionalString("xdf:inhalt");
        // TODO: Log warning for empty label

        return {
          type: "label",
          content: content || "Leerer Hinweis",
        };
      }

      default: {
        throw new Error(
          `Unknown input type for data field ${identifier}: ${type}`
        );
      }
    }

    let codeListReference: CodeListReference | undefined = undefined;
    let inputConstraints: InputConstraints | undefined = undefined;
    if (type === "select") {
      codeListReference = this.parseCodeListReference(data);
    } else if (type === "input") {
      const constraints = data.getOptionalString("xdf:praezisierung");
      inputConstraints = this.parseConstraints(identifier, constraints);
    }
    const content = data.getOptionalString("xdf:inhalt");
  }

  private parseConstraints(
    identifier: string,
    value: string | undefined
  ): InputConstraints | undefined {
    if (value === undefined) {
      return undefined;
    }

    let data;
    try {
      data = JSON.parse(value);
    } catch (error) {
      // Log a warning and just ignore the constraints for this input.
      this.warnings.push({
        type: "invalidInputConstraints",
        identifier,
        value,
      });
      return undefined;
    }

    const minLengthStr = data["minLength"];
    const maxLengthStr = data["maxLength"];
    const minValueStr = data["minValue"];
    const maxValueStr = data["maxValue"];
    const pattern = data["pattern"];
    if (pattern !== undefined && typeof pattern !== "string") {
      this.warnings.push({
        type: "invalidInputConstraints",
        identifier,
        value,
      });
      return undefined;
    }

    return {
      minLength: minLengthStr ? parseInt(minLengthStr) : undefined,
      maxLength: maxLengthStr ? parseInt(maxLengthStr) : undefined,
      minValue: minValueStr ? parseInt(minValueStr) : undefined,
      maxValue: maxValueStr ? parseInt(maxValueStr) : undefined,
      pattern,
    };
  }

  private parseCodeListReference(data: XmlData): CodeListReference {
    const referenceData = data.getChild("xdf:codelisteReferenz");
    const identifier = referenceData
      .getChild("xdf:identifikation")
      .getString("xdf:id");

    const identification = referenceData.getChild(
      "xdf:genericodeIdentification"
    );
    const canonicalUri = identification.getString(
      "xdf:canonicalIdentification"
    );
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
}

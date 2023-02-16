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

export interface ElementReference {
  type: "dataField" | "dataGroup";
  identifier: string;
  // relatedTo?: string;
  // amount: string
}

interface BasicData {
  identifier: string;
  version: string;
  name: string;
  inputLabel: string;
  outputLabel?: string;
  definition?: string;
  description?: string;
  relatedTo?: string;
  // status
  // validSince
  // validUntil
  creator?: string;
  versionInfo?: string;
  // releaseDate
}

export interface Rule extends BasicData {
  script: string;
}

interface ElementData extends BasicData {
  // type
  inputHint?: string;
  outputHint?: string;
}

export interface DataField extends ElementData {
  input: InputDescription;
  rules: Array<string>;
}

export interface DataGroup extends ElementData {
  elements: Array<ElementReference>;
  rules: Array<string>;
}

interface SchemaData extends BasicData {
  elements: Array<ElementReference>;
  rules: Array<string>;
  // help
  // ableitungsmodifikationenStruktur
  // ableitungsmodifikationenRepraesentation
}

export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaError";
  }
}

export interface InvalidInputConstraintsWarning {
  type: "invalidInputConstraints";
  identifier: string;
  value: string;
}

export interface MissingAttributeWarning {
  type: "missingAttribute";
  identifier: string;
  attribute: string;
}

export type Warning = InvalidInputConstraintsWarning | MissingAttributeWarning;

export class Schema {
  public readonly messageId: string;
  public readonly createdAt: Date;
  public readonly schemaData: SchemaData;
  public readonly dataFields: Record<string, DataField>;
  public readonly dataGroups: Record<string, DataGroup>;
  public readonly rules: Record<string, Rule>;

  constructor(
    messageId: string,
    createdAt: Date,
    schemaData: SchemaData,
    dataFields: Record<string, DataField>,
    dataGroups: Record<string, DataGroup>,
    rules: Record<string, Rule>
  ) {
    this.messageId = messageId;
    this.createdAt = createdAt;
    this.schemaData = schemaData;
    this.dataFields = dataFields;
    this.dataGroups = dataGroups;
    this.rules = rules;
  }

  public static fromString(stringData: string): Schema {
    return Schema.parse(stringData).schema;
  }

  public static parse(stringData: string): {
    schema: Schema;
    warnings: Warning[];
  } {
    return new SchemaParser().parseSchema(stringData);
  }

  public getDataField(identifier: string): DataField {
    const dataField = this.dataFields[identifier];
    if (dataField === undefined) {
      throw new Error(`Could not find data field ${identifier}`);
    }

    return dataField;
  }

  public getDataGroup(identifier: string): DataGroup {
    const dataGroup = this.dataGroups[identifier];
    if (dataGroup === undefined) {
      throw new Error(`Could not find data group ${identifier}`);
    }

    return dataGroup;
  }

  public get selectFields(): Array<DataField> {
    return Object.values(this.dataFields).filter(
      (dataField) => dataField.input.type === "select"
    );
  }

  public get codeListReferences(): Array<CodeListReference> {
    const references: Record<string, CodeListReference> = {};
    for (const dataField of Object.values(this.dataFields)) {
      if (dataField.input.type === "select") {
        const reference = dataField.input.codeListReference;
        references[reference.canonicalVersionUri] = reference;
      }
    }

    return Object.values(references);
  }
}

class SchemaParser {
  private warnings: Array<Warning> = [];

  public parseSchema(stringData: string): {
    schema: Schema;
    warnings: Warning[];
  } {
    const data = XmlData.fromString(stringData);

    const content = data.getChild("xdf:xdatenfelder.stammdatenschema.0102");
    const namespace = content.getString("@_xmlns:xdf");
    if (namespace !== "urn:xoev-de:fim:standard:xdatenfelder_2") {
      throw new SchemaError("Only xDatenfelder v2 is supported.");
    }

    const header = content.getChild("xdf:header");
    const messageId = header.getString("xdf:nachrichtID");
    const createdAt = header.getDate("xdf:erstellungszeitpunkt");

    const schemaNode = content.getChild("xdf:stammdatenschema");
    const basicData = this.parseBasicData(schemaNode);

    const structs = schemaNode.getArray("xdf:struktur").asXmlData();
    const dataFields: Record<string, DataField> = {};
    const dataGroups: Record<string, DataGroup> = {};
    const rules: Record<string, Rule> = {};
    const elements = this.collectStructs(
      basicData.identifier,
      structs,
      dataFields,
      dataGroups,
      rules
    );

    const ruleReferences = this.parseRules(schemaNode, rules);

    return {
      schema: new Schema(
        messageId,
        createdAt,
        {
          ...basicData,
          elements,
          rules: ruleReferences,
        },
        dataFields,
        dataGroups,
        rules
      ),
      warnings: this.warnings,
    };
  }

  private parseRules(
    data: XmlData,
    rules: Record<string, Rule>
  ): Array<string> {
    const entries = data
      .getArray("xdf:regel")
      .asXmlData()
      .map((value) => this.parseRule(value));

    const ruleReferences: Array<string> = [];
    for (const rule of entries) {
      rules[rule.identifier] = rule;
      ruleReferences.push(rule.identifier);
    }

    return ruleReferences;
  }

  private parseRule(data: XmlData): Rule {
    const basicData = this.parseBasicData(data);
    const script = data.getString("xdf:script");

    return {
      ...basicData,
      script,
    };
  }

  private collectStructs(
    identifier: string,
    structs: Array<XmlData>,
    dataFields: Record<string, DataField>,
    dataGroups: Record<string, DataGroup>,
    rules: Record<string, Rule>
  ): Array<ElementReference> {
    const elements: Array<ElementReference> = [];

    for (const struct of structs) {
      const content = struct.getChild("xdf:enthaelt");

      if (content.hasKey("xdf:datenfeldgruppe")) {
        const data = content.getChild("xdf:datenfeldgruppe");
        const group = this.parseDataGroup(data, dataFields, dataGroups, rules);

        elements.push({ type: "dataGroup", identifier: group.identifier });
        dataGroups[group.identifier] = group;
      } else if (content.hasKey("xdf:datenfeld")) {
        const data = content.getChild("xdf:datenfeld");
        const dataField = this.parseDataField(data, rules);

        elements.push({ type: "dataField", identifier: dataField.identifier });
        dataFields[dataField.identifier] = dataField;
      } else {
        content.print();
        throw new SchemaError(`Unknown struct type for ${identifier}`);
      }
    }

    return elements;
  }

  private parseDataGroup(
    data: XmlData,
    dataFields: Record<string, DataField>,
    dataGroups: Record<string, DataGroup>,
    rules: Record<string, Rule>
  ): DataGroup {
    const elementData = this.parseElementData(data);

    const structs = data.getArray("xdf:struktur").asXmlData();
    const elements = this.collectStructs(
      elementData.identifier,
      structs,
      dataFields,
      dataGroups,
      rules
    );

    const ruleReferences = this.parseRules(data, rules);

    return {
      ...elementData,
      elements,
      rules: ruleReferences,
    };
  }

  private parseDataField(
    data: XmlData,
    rules: Record<string, Rule>
  ): DataField {
    const elementData = this.parseElementData(data);

    const input = this.parseInputDescription(elementData.identifier, data);
    const ruleReferences = this.parseRules(data, rules);

    return {
      ...elementData,
      rules: ruleReferences,
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
        // TODO: Log warning if there are constraints not applicable to the specific
        // data type (e.g. `minValue` for a `bool`).
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

  private parseElementData(data: XmlData): ElementData {
    const basicData = this.parseBasicData(data);

    const inputHint = data.getOptionalString("xdf:hilfetextEingabe");
    const outputHint = data.getOptionalString("xdf:hilfetextAusgabe");

    return {
      ...basicData,
      inputHint,
      outputHint,
    };
  }

  private parseBasicData(data: XmlData): BasicData {
    const identification = data.getChild("xdf:identifikation");
    const identifier = identification.getString("xdf:id");
    const version = identification.getString("xdf:version");

    const name = data.getString("xdf:name");
    const definition = data.getOptionalString("xdf:definition");
    const creator = data.getOptionalString("xdf:fachlicherErsteller");
    const relatedTo = data.getOptionalString("xdf:bezug");
    const description = data.getOptionalString("xdf:beschreibung");
    let inputLabel = data.getOptionalString("xdf:bezeichnungEingabe");
    const outputLabel = data.getOptionalString("xdf:bezeichnungAusgabe");
    const versionInfo = data.getOptionalString("xdf:versionshinweis");

    if (inputLabel === undefined) {
      this.warnings.push({
        type: "missingAttribute",
        attribute: "xdf:bezeichnungEingabe",
        identifier,
      });
      inputLabel = name;
    }

    return {
      identifier,
      version,
      name,
      definition,
      creator,
      relatedTo,
      description,
      inputLabel,
      outputLabel,
      versionInfo,
    };
  }
}

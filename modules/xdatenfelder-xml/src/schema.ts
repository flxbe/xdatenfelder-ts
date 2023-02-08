import { XmlData } from "./xml";

export interface CodeListReference {
  identifier: string;
  version: string;
  canonicalUri: string;
  canonicalVersionUri: string;
}

export interface InputConstraints {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
}

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
  type: string;
  dataType: string;
  inputConstraints?: InputConstraints;
  codeListReference?: CodeListReference;
  content?: string;
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
      (dataField) => dataField.type === "select"
    );
  }

  public get codeListReferences(): Array<CodeListReference> {
    const references: Array<CodeListReference> = [];
    for (const dataField of Object.values(this.dataFields)) {
      if (dataField.codeListReference !== undefined) {
        references.push(dataField.codeListReference);
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

      if (content.hasChild("xdf:datenfeldgruppe")) {
        const data = content.getChild("xdf:datenfeldgruppe");
        const group = this.parseDataGroup(data, dataFields, dataGroups);

        steps.push(group.identifier);
        dataGroups[group.identifier] = group;
      } else if (content.hasChild("xdf:datenfeld")) {
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
    const type = data.getChild("xdf:feldart").getString("code");
    const dataType = data.getChild("xdf:datentyp").getString("code");
    const hilfetextEingabe = data.getOptionalString("xdf:hilfetextEingabe");
    const hilfetextAusgabe = data.getOptionalString("xdf:hilfetextAusgabe");

    let codeListReference: CodeListReference | undefined = undefined;
    let inputConstraints: InputConstraints | undefined = undefined;
    if (type === "select") {
      codeListReference = this.parseCodeListReference(data);
    } else if (type === "input") {
      const constraints = data.getOptionalString("xdf:praezisierung");
      inputConstraints = this.parseConstraints(identifier, constraints);
    }
    const content = data.getOptionalString("xdf:inhalt");

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
      type,
      dataType,
      codeListReference,
      inputConstraints,
      content,
    };
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

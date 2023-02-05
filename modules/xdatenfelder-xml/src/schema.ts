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
}

export class Schema {
  public messageId: string;
  public createdAt: Date;
  public schemaData: SchemaData;
  public dataFields: Array<DataField>;

  constructor(
    messageId: string,
    createdAt: Date,
    schemaData: SchemaData,
    dataFields: Array<DataField>
  ) {
    this.messageId = messageId;
    this.createdAt = createdAt;
    this.schemaData = schemaData;
    this.dataFields = dataFields;
  }

  public static fromString(stringData: string): Schema {
    //const parser = new DOMParser();
    // const document = parser.parseFromString(stringData, "text/xml");
    //console.log(document);
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
    collectDataFields(structs, dataFields);

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
      },
      Object.values(dataFields)
    );
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
      collectDataFields(group.getArray("xdf:struktur").asXmlData(), dataFields);
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
    codeListReference = parseCodeListReference(data);
  } else if (type === "input") {
    const constraints = data.getOptionalString("xdf:praezisierung");
    inputConstraints = parseConstraints(constraints);

    inputConstraints = {
      minLength: data.getOptionalInt("minLength"),
      maxLength: data.getOptionalInt("maxLength"),
    };
  }

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
  };
}

function parseConstraints(
  constraints: string | undefined
): InputConstraints | undefined {
  if (constraints === undefined) {
    return undefined;
  }

  let data;
  try {
    data = JSON.parse(constraints);
  } catch (error) {
    // TODO: Somehow collect warnings and display to user.
    // Maybe create a `Parser` instance, which collects warnings while parsing.
    return undefined;
  }

  const minLengthStr = data["minLength"];
  const maxLengthStr = data["maxLength"];

  return {
    minLength: minLengthStr ? parseInt(minLengthStr) : undefined,
    maxLength: maxLengthStr ? parseInt(maxLengthStr) : undefined,
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

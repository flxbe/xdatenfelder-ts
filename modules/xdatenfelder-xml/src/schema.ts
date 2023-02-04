import { XmlData } from "./xml";

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

export class Schema {
  public dataFields: Array<DataField>;

  constructor(dataFields: Array<DataField>) {
    this.dataFields = dataFields;
  }

  public static fromString(stringData: string): Schema {
    const data = XmlData.fromString(stringData);

    const schema = data
      .getChild("xdf:xdatenfelder.stammdatenschema.0102")
      .getChild("xdf:stammdatenschema");

    const structs = schema.getArray("xdf:struktur").asXmlData();

    const dataFields: Record<string, DataField> = {};
    collectDataFields(structs, dataFields);

    return new Schema(Object.values(dataFields));
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

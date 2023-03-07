import { ValidationError } from "../errors";
import { Table } from "../table";

export interface GenericodeIdentification {
  version: string;
  canonicalIdentification: string;
  canonicalVersionUri: string;
}

export interface CodelisteReferenz {
  id: string;
  version?: string;
  genericode: GenericodeIdentification;
}

export interface ElementReference {
  type: "dataField" | "dataGroup";
  identifier: string;
  bezug?: string;
  anzahl: string;
}

export const enum SchemaElementArt {
  Abstrakt = "ABS",
  Harmonisiert = "HAR",
  Rechtsnormgebunden = "RNG",
}

export function parseSchemaElementArt(value: string): SchemaElementArt {
  switch (value) {
    case "ABS":
      return SchemaElementArt.Abstrakt;
    case "HAR":
      return SchemaElementArt.Harmonisiert;
    case "RNG":
      return SchemaElementArt.Rechtsnormgebunden;
    default:
      throw new ValidationError(`Invalid value for SchemaElementArt: ${value}`);
  }
}

export type Feldart = "input" | "select" | "label";

export function parseFeldart(value: string): Feldart {
  switch (value) {
    case "input":
    case "select":
    case "label":
      return value;
    default:
      throw new ValidationError(`Invalid Feldart: ${value}`);
  }
}

export type Datentyp =
  | "text"
  | "date"
  | "bool"
  | "num_int"
  | "num_currency"
  | "file"
  | "obj";

export function parseDatentyp(value: string): Datentyp {
  switch (value) {
    case "text":
    case "date":
    case "bool":
    case "num_int":
    case "num_currency":
    case "file":
    case "obj":
      return value;
    default:
      throw new ValidationError(`Invalid Datentyp: ${value}`);
  }
}

export type ElementStatus = "inVorbereitung" | "aktiv" | "inaktiv";

export function parseElementStatus(value: string): ElementStatus {
  switch (value) {
    case "inVorbereitung":
    case "aktiv":
    case "inaktiv":
      return value;
    default:
      throw new ValidationError(`Invalid Status: ${value}`);
  }
}

export const enum AbleitungsmodifikationenStruktur {
  AllesModifizierbar = "0",
  NurErweiterbar = "1",
  NurEinschraenkbar = "2",
  NichtModifizierbar = "3",
}

export function parseAbleitungsmodifikationenStruktur(
  value: string
): AbleitungsmodifikationenStruktur {
  switch (value) {
    case "0":
      return AbleitungsmodifikationenStruktur.AllesModifizierbar;
    case "1":
      return AbleitungsmodifikationenStruktur.NurErweiterbar;
    case "2":
      return AbleitungsmodifikationenStruktur.NurEinschraenkbar;
    case "3":
      return AbleitungsmodifikationenStruktur.NichtModifizierbar;
    default:
      throw new ValidationError(
        `Invalid AbleitungsmodifikationenStruktur: ${value}`
      );
  }
}

export const enum AbleitungsmodifikationenRepraesentation {
  NichtModifizierbar = "0",
  Modifizierbar = "1",
}

export function parseAbleitungsmodifikationenRepraesentation(
  value: string
): AbleitungsmodifikationenRepraesentation {
  switch (value) {
    case "0":
      return AbleitungsmodifikationenRepraesentation.NichtModifizierbar;
    case "1":
      return AbleitungsmodifikationenRepraesentation.Modifizierbar;
    default:
      throw new ValidationError(
        `Invalid AbleitungsmodifikationenRepraesentation: ${value}`
      );
  }
}

export interface BaseData {
  identifier: string;
  id: string;
  version?: string;
  name: string;
  bezeichnungEingabe: string;
  bezeichnungAusgabe?: string;
  beschreibung?: string;
  definition?: string;
  bezug?: string;
  status: ElementStatus;
  gueltigAb?: Date;
  gueltigBis?: Date;
  fachlicherErsteller?: string;
  versionshinweis?: string;
  freigabedatum?: Date;
  veroeffentlichungsdatum?: Date;
}

export interface Regel extends BaseData {
  script?: string;
}

export interface ElementData extends BaseData {
  schemaelementart: SchemaElementArt;
  hilfetextEingabe?: string;
  hilfetextAusgabe?: string;
}

export interface Datenfeld extends ElementData {
  feldart: string;
  datentyp: string;
  praezisierung?: string;
  inhalt?: string;
  codelisteReferenz?: CodelisteReferenz;
  regeln: Array<string>;
}

export interface Datenfeldgruppe extends ElementData {
  elemente: Array<ElementReference>;
  regeln: Array<string>;
}

export interface Stammdatenschema extends BaseData {
  hilfetext?: string;
  ableitungsmodifikationenStruktur: AbleitungsmodifikationenStruktur;
  ableitungsmodifikationenRepraesentation: AbleitungsmodifikationenRepraesentation;
  regeln: Array<string>;
  elemente: Array<ElementReference>;
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

export interface SchemaWarnings {
  schemaWarnings: Warning[];
  dataFieldWarnings: Record<string, Warning[]>;
  dataGroupWarnings: Record<string, Warning[]>;
  ruleWarnings: Record<string, Warning[]>;
}

export interface SchemaContainer {
  schema: Stammdatenschema;

  datenfeldgruppen: Table<Datenfeldgruppe>;
  datenfelder: Table<Datenfeld>;
  regeln: Table<Regel>;
}

// See: https://www.xrepository.de/details/urn:xoev-de:xprozess:codeliste:status

import { ValidationError } from "./errors";

export const enum RegelTyp {
  Komplex = "K",
  Multiplizitaet = "M",
  Validierung = "V",
  Berechnung = "B",
}

export function parseRegelTyp(value: string): RegelTyp {
  switch (value) {
    case "K":
      return RegelTyp.Komplex;
    case "M":
      return RegelTyp.Multiplizitaet;
    case "V":
      return RegelTyp.Validierung;
    case "B":
      return RegelTyp.Berechnung;
    default:
      throw new ValidationError(`Invalid value in <xdf:typ>: ${value}`);
  }
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
      throw new ValidationError(
        `Invalid value in <xdf:schemaelementart>: ${value}`
      );
  }
}

// Version: 2022-07-12
export const enum FreigabeStatus {
  InPlanung = "1",
  InBearbeitung = "2",
  Entwurf = "3",
  MethodischFreigegeben = "4",
  FachlichFreigegebenSilber = "5",
  FachlichFreigegebenGold = "6",
  Inaktiv = "7",
  VorgesehenZumLoeschen = "8",
}

export function parseFreigabeStatus(value: string): FreigabeStatus {
  switch (value) {
    case "1":
      return FreigabeStatus.InPlanung;
    case "2":
      return FreigabeStatus.InBearbeitung;
    case "3":
      return FreigabeStatus.Entwurf;
    case "4":
      return FreigabeStatus.MethodischFreigegeben;
    case "5":
      return FreigabeStatus.FachlichFreigegebenSilber;
    case "6":
      return FreigabeStatus.FachlichFreigegebenGold;
    case "7":
      return FreigabeStatus.Inaktiv;
    case "8":
      return FreigabeStatus.VorgesehenZumLoeschen;
    default:
      throw new ValidationError(
        `Invalid value in <xdf:freigabestatus>: ${value}`
      );
  }
}

export function parseDate(value: string): Date {
  try {
    return new Date(value);
  } catch (error: unknown) {
    throw new ValidationError(`Invalid date: ${value}`);
  }
}

export interface NormReference {
  link?: string;
  value: string;
}

export interface BaseData {
  identifier: string;
  version: string;
  name: string;
  description?: string;
  definition?: string;
  releaseState: FreigabeStatus;
  stateSetAt?: Date;
  stateSetBy?: string;
  validSince?: Date;
  validUntil?: Date;
  versionHint?: string;
  publishedAt?: Date;
  lastChangedAt: Date;
  normReferences: NormReference[];
  // tags
}

export interface ElementData extends BaseData {
  inputLabel: string;
  outputLabel?: string;
  elementType: SchemaElementArt;
  inputHelp?: string;
  outputHelp?: string;
}

export interface ChildRef {
  type: "dataGroup" | "dataField";
  identifier: string;
  normReferences: NormReference[];
}

export interface DataGroup extends ElementData {
  rules: string[];
  children: ChildRef[];
}

export interface DataField extends ElementData {}

export interface Rule {
  identifier: string;
  version: string;
  name: string;
  description?: string;
  freeFormDefinition?: string;
  normReferences: NormReference[];
  // tags (Stichwort)
  creator?: string;
  lastChangedAt: Date;
  type: RegelTyp;
  // params
  // tagets
  script?: string;
  // errors
}

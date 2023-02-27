// See: https://www.xrepository.de/details/urn:xoev-de:xprozess:codeliste:status

import { ValidationError } from "./errors";

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
      throw new ValidationError(`Invalid value for freigabestatus: ${value}`);
  }
}

export function parseDate(value: string): Date {
  try {
    return new Date(value);
  } catch (error: unknown) {
    throw new ValidationError(`Invalid date: ${value}`);
  }
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
}

export interface ChildRef {
  type: "dataGroup" | "dataField";
  identifier: string;
}

export interface DataGroup extends BaseData {
  rules: string[];
  children: ChildRef[];
}

export interface DataField extends BaseData {}

export interface Rule {
  identifier: string;
  version: string;
  name: string;
  description?: string;
}

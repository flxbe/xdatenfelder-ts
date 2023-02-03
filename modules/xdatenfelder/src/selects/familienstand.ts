import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  FamilienstandValue,
  FamilienstandVariants,
  FamilienstandMetaData,
} from "../codelists/familienstand";

export class Familienstand extends SelectDataField<FamilienstandValue> {
  public static Variants = FamilienstandVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000275",
    version: "1.2",
    name: "Familienstand",
    bezeichnungEingabe: "Familienstand",
    bezeichnungAusgabe: "Familienstand",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Familienstand",
  };

  public static CodeListMeta: CodeListMetaData = FamilienstandMetaData;

  constructor(value: FamilienstandValue) {
    super(value, Familienstand.Variants);
  }

  public static fromString(value: string): Familienstand {
    if (Familienstand.isValid(value)) {
      return new Familienstand(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is FamilienstandValue {
    return value in Familienstand.Variants;
  }
}

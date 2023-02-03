import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  AnschriftInlandOderAuslandValue,
  AnschriftInlandOderAuslandVariants,
  AnschriftInlandOderAuslandMetaData,
} from "../codelists/anschrift-inland-oder-ausland";

export class AnschriftInlandOderAusland extends SelectDataField<AnschriftInlandOderAuslandValue> {
  public static Variants = AnschriftInlandOderAuslandVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000263",
    version: "2.0",
    name: "Abfrage Anschrift Inland oder Ausland",
    bezeichnungEingabe: "Wo befindet sich die Anschrift?",
    bezeichnungAusgabe: "Die Anschrift befindet sich:",
    hilfetextEingabe:
      "Geben Sie an, ob sich die Anschrift im Inland oder im Ausland befindet.",
    hilfetextAusgabe: "Die Anschrift befindet sich:",
  };

  public static CodeListMeta: CodeListMetaData =
    AnschriftInlandOderAuslandMetaData;

  constructor(value: AnschriftInlandOderAuslandValue) {
    super(value, AnschriftInlandOderAusland.Variants);
  }

  public static fromString(value: string): AnschriftInlandOderAusland {
    if (AnschriftInlandOderAusland.isValid(value)) {
      return new AnschriftInlandOderAusland(value);
    }

    throw "Wrong value";
  }

  public static isValid(
    value: string
  ): value is AnschriftInlandOderAuslandValue {
    return value in AnschriftInlandOderAusland.Variants;
  }
}

import { DataFieldMetaData, CodeListMetaData, BaseEnumDataField } from "./base";
import {
  Value,
  Variants,
  MetaData,
} from "../codelists/anschrift-inland-oder-ausland";

export class AnschriftInlandOderAusland extends BaseEnumDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000263",
    version: "1.1",
    name: "Abfrage Anschrift Inland oder Ausland",
    definition:
      "Abfrage, ob sich die Anschrift im Inland oder Ausland befindet.",
    bezeichnungEingabe: "Wo befindet sich die Anschrift?",
    bezeichnungAusgabe: "Die Anschrift befindet sich:",
    hilfetextEingabe:
      "Geben Sie an, ob sich die Anschrift im Inland oder im Ausland befindet.",
    hilfetextAusgabe: undefined,
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, AnschriftInlandOderAusland.Variants);
  }

  public static fromString(value: string): AnschriftInlandOderAusland {
    if (AnschriftInlandOderAusland.isValid(value)) {
      return new AnschriftInlandOderAusland(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in AnschriftInlandOderAusland.Variants;
  }
}

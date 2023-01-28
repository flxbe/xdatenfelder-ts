import { DataFieldMetaData, CodeListMetaData, BaseEnumDataField } from "./base";

type AnschriftInlandOderAuslandValue = "001" | "002";

export class AnschriftInlandOderAusland extends BaseEnumDataField<AnschriftInlandOderAuslandValue> {
  public static Variants: Record<AnschriftInlandOderAuslandValue, string> = {
    "001": "Ehe aufgehoben",
    "002": "außerhalb von Deutschland",
  };

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

  public static CodeListMeta: CodeListMetaData = {
    id: "C60000006",
    version: "2020-08-18",
    kennung: "urn:de:fim:codeliste:anschriftinlandoderausland",
  };

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

import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  klassifikationKommunikationValue,
  klassifikationKommunikationVariants,
  klassifikationKommunikationMetaData,
} from "../codelists/klassifikation-kommunikation";

export class KommunikationKlassifikation extends SelectDataField<klassifikationKommunikationValue> {
  public static Variants = klassifikationKommunikationVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000378",
    version: "1.1",
    name: "Kommunikation - Klassifikation",
    bezeichnungEingabe:
      "Auswahl der Art der Kommunikation (privat, geschäftlich, ...)",
    bezeichnungAusgabe:
      "Auswahl der Art der Kommunikation (privat, geschäftlich, ...)",
    hilfetextEingabe: undefined,
    hilfetextAusgabe:
      "Auswahl der Art der Kommunikation (privat, geschäftlich, ...)",
  };

  public static CodeListMeta: CodeListMetaData =
    klassifikationKommunikationMetaData;

  constructor(value: klassifikationKommunikationValue) {
    super(value, KommunikationKlassifikation.Variants);
  }

  public static fromString(value: string): KommunikationKlassifikation {
    if (KommunikationKlassifikation.isValid(value)) {
      return new KommunikationKlassifikation(value);
    }

    throw "Wrong value";
  }

  public static isValid(
    value: string
  ): value is klassifikationKommunikationValue {
    return value in KommunikationKlassifikation.Variants;
  }
}

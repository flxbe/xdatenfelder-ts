import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  GeschlechtValue,
  GeschlechtVariants,
  GeschlechtMetaData,
} from "../codelists/geschlecht";

export class Geschlecht extends SelectDataField<GeschlechtValue> {
  public static Variants = GeschlechtVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000332",
    version: "1.3",
    name: "Geschlecht",
    bezeichnungEingabe: "Geschlecht",
    bezeichnungAusgabe: "Geschlecht",
    hilfetextEingabe:
      "Geben Sie das Geschlecht an, das auch beim Personenstandsregister oder Standesamt hinterlegt ist.",
    hilfetextAusgabe: "Geschlecht",
  };

  public static CodeListMeta: CodeListMetaData = GeschlechtMetaData;

  constructor(value: GeschlechtValue) {
    super(value, Geschlecht.Variants);
  }

  public static fromString(value: string): Geschlecht {
    if (Geschlecht.isValid(value)) {
      return new Geschlecht(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is GeschlechtValue {
    return value in Geschlecht.Variants;
  }
}

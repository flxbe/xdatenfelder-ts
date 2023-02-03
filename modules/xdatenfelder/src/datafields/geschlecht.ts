import { DataFieldMetaData, CodeListMetaData, BaseEnumDataField } from "./base";
import { Value, Variants, MetaData } from "../codelists/geschlecht";

export class Geschlecht extends BaseEnumDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000332",
    version: "1.2",
    name: "Geschlecht",
    definition:
      "Beschreibt das Geschlecht einer Person. Folgende Angaben sind möglich: divers, männlich, weiblich, keine Angabe",
    bezeichnungEingabe: "Geschlecht",
    bezeichnungAusgabe: "Geschlecht",
    hilfetextEingabe:
      "Geben Sie das Geschlecht an, das auch beim Personenstandsregister oder Standesamt hinterlegt ist.",
    hilfetextAusgabe: undefined,
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Geschlecht.Variants);
  }

  public static fromString(value: string): Geschlecht {
    if (Geschlecht.isValid(value)) {
      return new Geschlecht(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Geschlecht.Variants;
  }
}

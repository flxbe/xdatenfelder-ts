import { DataFieldMetaData, CodeListMetaData, BaseEnumDataField } from "./base";

type GeschlechtValue = "d" | "m" | "w" | "x";

export class Geschlecht extends BaseEnumDataField<GeschlechtValue> {
  public static Variants: Record<GeschlechtValue, string> = {
    d: "divers",
    m: "männlich",
    w: "weiblich",
    x: "Keine Angabe",
  };

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

  public static CodeListMeta: CodeListMetaData = {
    id: "C60000018",
    version: "3",
    kennung: "urn:xpersonenstand:schluesseltabelle:geschlecht",
  };

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

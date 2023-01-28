import { DataFieldMetaData, CodeListMetaData } from "./base";

type GeschlechtValue = "d" | "m" | "w" | "x";

export class Geschlecht {
  public static Meta: DataFieldMetaData = {
    id: "F60000332",
    version: "1.2",
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

  public static Variants: Record<GeschlechtValue, string> = {
    d: "divers",
    m: "männlich",
    w: "weiblich",
    x: "Keine Angabe",
  };

  private _value: GeschlechtValue;

  private constructor(value: GeschlechtValue) {
    this._value = value;
  }

  public get value(): GeschlechtValue {
    return this.value;
  }

  public get label(): string {
    return Geschlecht.Variants[this._value];
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

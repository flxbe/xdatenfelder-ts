import { DataFieldMetaData, CodeListMetaData, BaseEnumDataField } from "./base";

type FamilienstandValue =
  | "EA"
  | "GS"
  | "LA"
  | "LD"
  | "LE"
  | "LP"
  | "LV"
  | "NB"
  | "VH"
  | "VW";

export class Familienstand extends BaseEnumDataField<FamilienstandValue> {
  public static Variants: Record<FamilienstandValue, string> = {
    EA: "Ehe aufgehoben",
    GS: "geschieden",
    LA: "aufgehobene Lebenspartnerschaft",
    LD: "ledig",
    LE: "durch Todeserklärung aufgelöste Lebenspartnerschaft",
    LP: "in eingetragener Lebenspartnerschaft",
    LV: "durch Tod aufgelöste Lebenspartnerschaft",
    NB: "nicht bekannt",
    VH: "verheiratet",
    VW: "verwitwet",
  };

  public static Meta: DataFieldMetaData = {
    id: "F60000275",
    version: "1.2",
    definition: undefined,
    bezeichnungEingabe: "Familienstand",
    bezeichnungAusgabe: "Familienstand",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: undefined,
  };

  public static CodeListMeta: CodeListMetaData = {
    id: "C60000001",
    version: "2",
    kennung: "urn:de:dsmeld:schluesseltabelle:familienstand",
  };

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

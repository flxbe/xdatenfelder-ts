import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { StaatValue, StaatVariants, StaatMetaData } from "../codelists/staat";

export class Geburtsland extends SelectDataField<StaatValue> {
  public static Variants = StaatVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000235",
    version: "1.2",
    name: "Geburtsland / Staat der Geburt",
    bezeichnungEingabe: "Staat der Geburt",
    bezeichnungAusgabe: "Staat der Geburt",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Staat der Geburt",
  };

  public static CodeListMeta: CodeListMetaData = StaatMetaData;

  constructor(value: StaatValue) {
    super(value, Geburtsland.Variants);
  }

  public static fromString(value: string): Geburtsland {
    if (Geburtsland.isValid(value)) {
      return new Geburtsland(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is StaatValue {
    return value in Geburtsland.Variants;
  }
}

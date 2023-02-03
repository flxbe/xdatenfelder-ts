import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/staat";

export class Geburtsland extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000235",
    version: "1.2",
    name: "Geburtsland / Staat der Geburt",
    bezeichnungEingabe: "Staat der Geburt",
    bezeichnungAusgabe: "Staat der Geburt",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Staat der Geburt",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Geburtsland.Variants);
  }

  public static fromString(value: string): Geburtsland {
    if (Geburtsland.isValid(value)) {
      return new Geburtsland(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Geburtsland.Variants;
  }
}

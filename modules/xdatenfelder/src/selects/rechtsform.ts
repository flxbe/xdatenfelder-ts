import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/rechtsform";

export class Rechtsform extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000339",
    version: "2.2",
    name: "Rechtsform (XUnternehmen)",
    bezeichnungEingabe: "Rechtsform",
    bezeichnungAusgabe: "Rechtsform",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Rechtsform",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Rechtsform.Variants);
  }

  public static fromString(value: string): Rechtsform {
    if (Rechtsform.isValid(value)) {
      return new Rechtsform(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Rechtsform.Variants;
  }
}

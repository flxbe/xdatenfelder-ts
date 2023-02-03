import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/registergerichte";

export class Registergericht extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000325",
    version: "1.2",
    name: "Registergericht (Code)",
    bezeichnungEingabe: "Registergericht",
    bezeichnungAusgabe: "Registergericht",
    hilfetextEingabe:
      "Geben Sie das Registergericht an, bei dem die Organisation eingetragen ist.",
    hilfetextAusgabe: "Registergericht",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Registergericht.Variants);
  }

  public static fromString(value: string): Registergericht {
    if (Registergericht.isValid(value)) {
      return new Registergericht(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Registergericht.Variants;
  }
}

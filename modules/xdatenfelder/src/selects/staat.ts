import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/staat";

export class Staat extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000261",
    version: "2.0",
    name: "Staat",
    bezeichnungEingabe: "Staat",
    bezeichnungAusgabe: "Staat",
    hilfetextEingabe:
      "Geben Sie den Namen des Staates bzw. des Landes an, Beispiel Deutschland.",
    hilfetextAusgabe: "Staat",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Staat.Variants);
  }

  public static fromString(value: string): Staat {
    if (Staat.isValid(value)) {
      return new Staat(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Staat.Variants;
  }
}

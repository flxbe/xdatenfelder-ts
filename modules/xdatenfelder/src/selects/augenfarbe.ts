import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/augenfarbe";

export class Augenfarbe extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000281",
    version: "1.2",
    name: "Augenfarbe Person",
    bezeichnungEingabe: "Augenfarbe",
    bezeichnungAusgabe: "Augenfarbe",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Augenfarbe",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Augenfarbe.Variants);
  }

  public static fromString(value: string): Augenfarbe {
    if (Augenfarbe.isValid(value)) {
      return new Augenfarbe(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Augenfarbe.Variants;
  }
}

import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  Value,
  Variants,
  MetaData,
} from "../codelists/industrie-und-handelskammer";

export class IndustrieUndHandelskammer extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000348",
    version: "1.0",
    name: "Industrie- und Handelskammer / IHK",
    bezeichnungEingabe: "IHK",
    bezeichnungAusgabe: "IHK",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "IHK",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, IndustrieUndHandelskammer.Variants);
  }

  public static fromString(value: string): IndustrieUndHandelskammer {
    if (IndustrieUndHandelskammer.isValid(value)) {
      return new IndustrieUndHandelskammer(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in IndustrieUndHandelskammer.Variants;
  }
}

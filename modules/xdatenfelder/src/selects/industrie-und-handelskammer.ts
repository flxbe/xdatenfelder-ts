import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  IndustrieUndHandelskammerValue,
  IndustrieUndHandelskammerVariants,
  IndustrieUndHandelskammerMetaData,
} from "../codelists/industrie-und-handelskammer";

export class IndustrieUndHandelskammer extends SelectDataField<IndustrieUndHandelskammerValue> {
  public static Variants = IndustrieUndHandelskammerVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000348",
    version: "1.0",
    name: "Industrie- und Handelskammer / IHK",
    bezeichnungEingabe: "IHK",
    bezeichnungAusgabe: "IHK",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "IHK",
  };

  public static CodeListMeta: CodeListMetaData =
    IndustrieUndHandelskammerMetaData;

  constructor(value: IndustrieUndHandelskammerValue) {
    super(value, IndustrieUndHandelskammer.Variants);
  }

  public static fromString(value: string): IndustrieUndHandelskammer {
    if (IndustrieUndHandelskammer.isValid(value)) {
      return new IndustrieUndHandelskammer(value);
    }

    throw "Wrong value";
  }

  public static isValid(
    value: string
  ): value is IndustrieUndHandelskammerValue {
    return value in IndustrieUndHandelskammer.Variants;
  }
}

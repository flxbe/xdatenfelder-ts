import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { StaatValue, StaatVariants, StaatMetaData } from "../codelists/staat";

export class Staat extends SelectDataField<StaatValue> {
  public static Variants = StaatVariants;

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

  public static CodeListMeta: CodeListMetaData = StaatMetaData;

  constructor(value: StaatValue) {
    super(value, Staat.Variants);
  }

  public static fromString(value: string): Staat {
    if (Staat.isValid(value)) {
      return new Staat(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is StaatValue {
    return value in Staat.Variants;
  }
}

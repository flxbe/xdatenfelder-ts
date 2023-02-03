import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { StaatValue, StaatVariants, StaatMetaData } from "../codelists/staat";

export class HerausgebenderStaat extends SelectDataField<StaatValue> {
  public static Variants = StaatVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000237",
    version: "1.2",
    name: "Herausgebender Staat",
    bezeichnungEingabe: "Staat",
    bezeichnungAusgabe: "Staat",
    hilfetextEingabe:
      "Geben Sie den Namen des Staates bzw. des Landes an, welches das Dokument oder die Urkunde herausgegeben hat.",
    hilfetextAusgabe: "Staat",
  };

  public static CodeListMeta: CodeListMetaData = StaatMetaData;

  constructor(value: StaatValue) {
    super(value, HerausgebenderStaat.Variants);
  }

  public static fromString(value: string): HerausgebenderStaat {
    if (HerausgebenderStaat.isValid(value)) {
      return new HerausgebenderStaat(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is StaatValue {
    return value in HerausgebenderStaat.Variants;
  }
}

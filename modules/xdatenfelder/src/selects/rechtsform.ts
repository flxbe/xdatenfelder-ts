import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  RechtsformValue,
  RechtsformVariants,
  RechtsformMetaData,
} from "../codelists/rechtsform";

export class Rechtsform extends SelectDataField<RechtsformValue> {
  public static Variants = RechtsformVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000339",
    version: "2.2",
    name: "Rechtsform (XUnternehmen)",
    bezeichnungEingabe: "Rechtsform",
    bezeichnungAusgabe: "Rechtsform",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Rechtsform",
  };

  public static CodeListMeta: CodeListMetaData = RechtsformMetaData;

  constructor(value: RechtsformValue) {
    super(value, Rechtsform.Variants);
  }

  public static fromString(value: string): Rechtsform {
    if (Rechtsform.isValid(value)) {
      return new Rechtsform(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is RechtsformValue {
    return value in Rechtsform.Variants;
  }
}

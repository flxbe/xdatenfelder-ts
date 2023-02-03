import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  RechtsformGaengigValue,
  RechtsformGaengigVariants,
  RechtsformGaengigMetaData,
} from "../codelists/rechtsform-gaengig";

export class RechtsformReduziert extends SelectDataField<RechtsformGaengigValue> {
  public static Variants = RechtsformGaengigVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000346",
    version: "1.0",
    name: "Rechtsform (reduziert)",
    bezeichnungEingabe: "Welche Rechtsform hat das Unternehmen?",
    bezeichnungAusgabe: "Rechtsform des Unternehmens",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Rechtsform des Unternehmens",
  };

  public static CodeListMeta: CodeListMetaData = RechtsformGaengigMetaData;

  constructor(value: RechtsformGaengigValue) {
    super(value, RechtsformReduziert.Variants);
  }

  public static fromString(value: string): RechtsformReduziert {
    if (RechtsformReduziert.isValid(value)) {
      return new RechtsformReduziert(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is RechtsformGaengigValue {
    return value in RechtsformReduziert.Variants;
  }
}

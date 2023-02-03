import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { StaatValue, StaatVariants, StaatMetaData } from "../codelists/staat";

export class SterbeortStaat extends SelectDataField<StaatValue> {
  public static Variants = StaatVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000286",
    version: "1.2",
    name: "Sterbeort (Staat)",
    bezeichnungEingabe: "Sterbeland",
    bezeichnungAusgabe: "Sterbeland",
    hilfetextEingabe:
      "Geben Sie das Land an, in dem die Person verstorben ist, Beispiel Italien.",
    hilfetextAusgabe: "Sterbeland",
  };

  public static CodeListMeta: CodeListMetaData = StaatMetaData;

  constructor(value: StaatValue) {
    super(value, SterbeortStaat.Variants);
  }

  public static fromString(value: string): SterbeortStaat {
    if (SterbeortStaat.isValid(value)) {
      return new SterbeortStaat(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is StaatValue {
    return value in SterbeortStaat.Variants;
  }
}

import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/staat";

export class SterbeortStaat extends SelectDataField<Value> {
  public static Variants = Variants;

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

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, SterbeortStaat.Variants);
  }

  public static fromString(value: string): SterbeortStaat {
    if (SterbeortStaat.isValid(value)) {
      return new SterbeortStaat(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in SterbeortStaat.Variants;
  }
}

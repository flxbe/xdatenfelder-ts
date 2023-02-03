import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  GesetzlicherVertreterBevollmaechtigterValue,
  GesetzlicherVertreterBevollmaechtigterVariants,
  GesetzlicherVertreterBevollmaechtigterMetaData,
} from "../codelists/gesetzlicher-vertreter-bevollmaechtigter";

export class VertretungGesetzlicherVertreterOrderBevollmaechtigter extends SelectDataField<GesetzlicherVertreterBevollmaechtigterValue> {
  public static Variants = GesetzlicherVertreterBevollmaechtigterVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000352",
    version: "1.0",
    name: "Vertretung durch gesetzlichen Vertreter oder Bevollmächtigten (Antragsteller)",
    bezeichnungEingabe: "Wird die antragstellende Person vertreten?",
    bezeichnungAusgabe: "Vertretung der antragstellenden Person",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Vertretung der antragstellenden Person",
  };

  public static CodeListMeta: CodeListMetaData =
    GesetzlicherVertreterBevollmaechtigterMetaData;

  constructor(value: GesetzlicherVertreterBevollmaechtigterValue) {
    super(
      value,
      VertretungGesetzlicherVertreterOrderBevollmaechtigter.Variants
    );
  }

  public static fromString(
    value: string
  ): VertretungGesetzlicherVertreterOrderBevollmaechtigter {
    if (VertretungGesetzlicherVertreterOrderBevollmaechtigter.isValid(value)) {
      return new VertretungGesetzlicherVertreterOrderBevollmaechtigter(value);
    }

    throw "Wrong value";
  }

  public static isValid(
    value: string
  ): value is GesetzlicherVertreterBevollmaechtigterValue {
    return (
      value in VertretungGesetzlicherVertreterOrderBevollmaechtigter.Variants
    );
  }
}

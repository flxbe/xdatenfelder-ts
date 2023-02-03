import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  Value,
  Variants,
  MetaData,
} from "../codelists/gesetzlicher-vertreter-bevollmaechtigter";

export class VertretungGesetzlicherVertreterOrderBevollmaechtigter extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000352",
    version: "1.0",
    name: "Vertretung durch gesetzlichen Vertreter oder Bevollmächtigten (Antragsteller)",
    bezeichnungEingabe: "Wird die antragstellende Person vertreten?",
    bezeichnungAusgabe: "Vertretung der antragstellenden Person",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Vertretung der antragstellenden Person",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
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

  public static isValid(value: string): value is Value {
    return (
      value in VertretungGesetzlicherVertreterOrderBevollmaechtigter.Variants
    );
  }
}

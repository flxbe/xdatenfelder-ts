import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/gesetzlicher-vertreter";

export class GesetzlicherVertreter extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000318",
    version: "1.1",
    name: "Abfrage Gesetzlicher Vertreter (Unterscheidung juristische/natürliche Person)",
    bezeichnungEingabe:
      "Vertritt eine gesetzlich vertretende Person die antragstellende Person?",
    bezeichnungAusgabe: "Vertretung durch eine gesetzlich vertretende Person",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Vertretung durch eine gesetzlich vertretende Person",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, GesetzlicherVertreter.Variants);
  }

  public static fromString(value: string): GesetzlicherVertreter {
    if (GesetzlicherVertreter.isValid(value)) {
      return new GesetzlicherVertreter(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in GesetzlicherVertreter.Variants;
  }
}

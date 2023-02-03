import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  GesetzlicherVertreterValue,
  GesetzlicherVertreterVariants,
  GesetzlicherVertreterMetaData,
} from "../codelists/gesetzlicher-vertreter";

export class GesetzlicherVertreter extends SelectDataField<GesetzlicherVertreterValue> {
  public static Variants = GesetzlicherVertreterVariants;

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

  public static CodeListMeta: CodeListMetaData = GesetzlicherVertreterMetaData;

  constructor(value: GesetzlicherVertreterValue) {
    super(value, GesetzlicherVertreter.Variants);
  }

  public static fromString(value: string): GesetzlicherVertreter {
    if (GesetzlicherVertreter.isValid(value)) {
      return new GesetzlicherVertreter(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is GesetzlicherVertreterValue {
    return value in GesetzlicherVertreter.Variants;
  }
}

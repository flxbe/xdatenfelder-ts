import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  Value,
  Variants,
  MetaData,
} from "../codelists/art-gesetzlicher-vertreter";

export class ArtGesetzlicherVertreter extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000375",
    version: "1.0",
    name: "Art des gesetzlichen Vertreters",
    bezeichnungEingabe: "Art des gesetzlichen Vertreters",
    bezeichnungAusgabe: "Art des gesetzlichen Vertreters",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Art des gesetzlichen Vertreters",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, ArtGesetzlicherVertreter.Variants);
  }

  public static fromString(value: string): ArtGesetzlicherVertreter {
    if (ArtGesetzlicherVertreter.isValid(value)) {
      return new ArtGesetzlicherVertreter(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in ArtGesetzlicherVertreter.Variants;
  }
}

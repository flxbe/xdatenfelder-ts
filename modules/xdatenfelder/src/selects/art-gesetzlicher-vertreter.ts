import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  ArtGesetzlicherVertreterValue,
  ArtGesetzlicherVertreterVariants,
  ArtGesetzlicherVertreterMetaData,
} from "../codelists/art-gesetzlicher-vertreter";

export class ArtGesetzlicherVertreter extends SelectDataField<ArtGesetzlicherVertreterValue> {
  public static Variants = ArtGesetzlicherVertreterVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000375",
    version: "1.0",
    name: "Art des gesetzlichen Vertreters",
    bezeichnungEingabe: "Art des gesetzlichen Vertreters",
    bezeichnungAusgabe: "Art des gesetzlichen Vertreters",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Art des gesetzlichen Vertreters",
  };

  public static CodeListMeta: CodeListMetaData =
    ArtGesetzlicherVertreterMetaData;

  constructor(value: ArtGesetzlicherVertreterValue) {
    super(value, ArtGesetzlicherVertreter.Variants);
  }

  public static fromString(value: string): ArtGesetzlicherVertreter {
    if (ArtGesetzlicherVertreter.isValid(value)) {
      return new ArtGesetzlicherVertreter(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is ArtGesetzlicherVertreterValue {
    return value in ArtGesetzlicherVertreter.Variants;
  }
}

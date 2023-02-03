import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  ArtAnschriftValue,
  ArtAnschriftVariants,
  ArtAnschriftMetaData,
} from "../codelists/art-anschrift";

export class ArtAnschrift extends SelectDataField<ArtAnschriftValue> {
  public static Variants = ArtAnschriftVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000376",
    version: "1.0",
    name: "Art der Anschrift (XUnternehmen)",
    bezeichnungEingabe: "Art der Anschrift",
    bezeichnungAusgabe: "Art der Anschrift",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Art der Anschrift",
  };

  public static CodeListMeta: CodeListMetaData = ArtAnschriftMetaData;

  constructor(value: ArtAnschriftValue) {
    super(value, ArtAnschrift.Variants);
  }

  public static fromString(value: string): ArtAnschrift {
    if (ArtAnschrift.isValid(value)) {
      return new ArtAnschrift(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is ArtAnschriftValue {
    return value in ArtAnschrift.Variants;
  }
}

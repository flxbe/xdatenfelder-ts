import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/art-anschrift";

export class ArtAnschrift extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000376",
    version: "1.0",
    name: "Art der Anschrift (XUnternehmen)",
    bezeichnungEingabe: "Art der Anschrift",
    bezeichnungAusgabe: "Art der Anschrift",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Art der Anschrift",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, ArtAnschrift.Variants);
  }

  public static fromString(value: string): ArtAnschrift {
    if (ArtAnschrift.isValid(value)) {
      return new ArtAnschrift(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in ArtAnschrift.Variants;
  }
}

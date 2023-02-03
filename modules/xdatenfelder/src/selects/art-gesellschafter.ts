import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  ArtGesellschafterPersonengesellschaftValue,
  ArtGesellschafterPersonengesellschaftVariants,
  ArtGesellschafterPersonengesellschaftMetaData,
} from "../codelists/art-gesellschafter-personengesellschaft";

export class ArtGesellschafter extends SelectDataField<ArtGesellschafterPersonengesellschaftValue> {
  public static Variants = ArtGesellschafterPersonengesellschaftVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000342",
    version: "1.0",
    name: "Gesellschafter Art",
    bezeichnungEingabe: "Gesellschafterart",
    bezeichnungAusgabe: "Gesellschafterart",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Gesellschafterart",
  };

  public static CodeListMeta: CodeListMetaData =
    ArtGesellschafterPersonengesellschaftMetaData;

  constructor(value: ArtGesellschafterPersonengesellschaftValue) {
    super(value, ArtGesellschafter.Variants);
  }

  public static fromString(value: string): ArtGesellschafter {
    if (ArtGesellschafter.isValid(value)) {
      return new ArtGesellschafter(value);
    }

    throw "Wrong value";
  }

  public static isValid(
    value: string
  ): value is ArtGesellschafterPersonengesellschaftValue {
    return value in ArtGesellschafter.Variants;
  }
}

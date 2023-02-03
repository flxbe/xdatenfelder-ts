import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import { Value, Variants, MetaData } from "../codelists/art-niederlassung";

export class ArtBetriebsstaette extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000363",
    version: "1.0",
    name: "Art der Betriebsstätte",
    bezeichnungEingabe: "Art der Niederlassung",
    bezeichnungAusgabe: "Art der Niederlassung",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Art der Niederlassung",
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, ArtBetriebsstaette.Variants);
  }

  public static fromString(value: string): ArtBetriebsstaette {
    if (ArtBetriebsstaette.isValid(value)) {
      return new ArtBetriebsstaette(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in ArtBetriebsstaette.Variants;
  }
}

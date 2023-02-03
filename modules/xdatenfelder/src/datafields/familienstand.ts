import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "./base";

import { Value, Variants, MetaData } from "../codelists/familienstand";

export class Familienstand extends SelectDataField<Value> {
  public static Variants = Variants;

  public static Meta: DataFieldMetaData = {
    id: "F60000275",
    version: "1.2",
    name: "Familienstand",
    definition: undefined,
    bezeichnungEingabe: "Familienstand",
    bezeichnungAusgabe: "Familienstand",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: undefined,
  };

  public static CodeListMeta: CodeListMetaData = MetaData;

  constructor(value: Value) {
    super(value, Familienstand.Variants);
  }

  public static fromString(value: string): Familienstand {
    if (Familienstand.isValid(value)) {
      return new Familienstand(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is Value {
    return value in Familienstand.Variants;
  }
}

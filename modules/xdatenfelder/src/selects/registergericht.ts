import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  RegistergerichteValue,
  RegistergerichteVariants,
  RegistergerichteMetaData,
} from "../codelists/registergerichte";

export class Registergericht extends SelectDataField<RegistergerichteValue> {
  public static Variants = RegistergerichteVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000325",
    version: "1.2",
    name: "Registergericht (Code)",
    bezeichnungEingabe: "Registergericht",
    bezeichnungAusgabe: "Registergericht",
    hilfetextEingabe:
      "Geben Sie das Registergericht an, bei dem die Organisation eingetragen ist.",
    hilfetextAusgabe: "Registergericht",
  };

  public static CodeListMeta: CodeListMetaData = RegistergerichteMetaData;

  constructor(value: RegistergerichteValue) {
    super(value, Registergericht.Variants);
  }

  public static fromString(value: string): Registergericht {
    if (Registergericht.isValid(value)) {
      return new Registergericht(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is RegistergerichteValue {
    return value in Registergericht.Variants;
  }
}

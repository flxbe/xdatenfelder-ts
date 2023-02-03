import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  HandwerkskammerValue,
  HandwerkskammerVariants,
  HandwerkskammerMetaData,
} from "../codelists/handwerkskammer";

export class Handwerkskammer extends SelectDataField<HandwerkskammerValue> {
  public static Variants = HandwerkskammerVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000349",
    version: "1.0",
    name: "Handwerkskammer / HWK",
    bezeichnungEingabe: "Handwerkskammer",
    bezeichnungAusgabe: "Handwerkskammer",
    hilfetextEingabe: undefined,
    hilfetextAusgabe: "Handwerkskammer",
  };

  public static CodeListMeta: CodeListMetaData = HandwerkskammerMetaData;

  constructor(value: HandwerkskammerValue) {
    super(value, Handwerkskammer.Variants);
  }

  public static fromString(value: string): Handwerkskammer {
    if (Handwerkskammer.isValid(value)) {
      return new Handwerkskammer(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is HandwerkskammerValue {
    return value in Handwerkskammer.Variants;
  }
}

import { DataFieldMetaData, CodeListMetaData, SelectDataField } from "../base";
import {
  StaatsangehoerigkeitValue,
  StaatsangehoerigkeitVariants,
  StaatsangehoerigkeitMetaData,
} from "../codelists/staatsangehoerigkeit";

export class Staatsangehoerigkeit extends SelectDataField<StaatsangehoerigkeitValue> {
  public static Variants = StaatsangehoerigkeitVariants;

  public static Meta: DataFieldMetaData = {
    id: "F60000236",
    version: "1.3",
    name: "Staatsangehörigkeit",
    bezeichnungEingabe: "Staatsangehörigkeit",
    bezeichnungAusgabe: "Staatsangehörigkeit",
    hilfetextEingabe:
      'Wählen Sie aus, welcher Nationalität bzw. welchen Nationalitäten die Person angehört. Es ist auch die Auswahl "ohne Angabe" möglich, falls die Person keiner Nationalität angehört.&#xD;',
    hilfetextAusgabe: "Staatsangehörigkeit",
  };

  public static CodeListMeta: CodeListMetaData = StaatsangehoerigkeitMetaData;

  constructor(value: StaatsangehoerigkeitValue) {
    super(value, Staatsangehoerigkeit.Variants);
  }

  public static fromString(value: string): Staatsangehoerigkeit {
    if (Staatsangehoerigkeit.isValid(value)) {
      return new Staatsangehoerigkeit(value);
    }

    throw "Wrong value";
  }

  public static isValid(value: string): value is StaatsangehoerigkeitValue {
    return value in Staatsangehoerigkeit.Variants;
  }
}

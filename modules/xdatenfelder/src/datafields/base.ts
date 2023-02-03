export interface DataFieldMetaData {
  id: string;
  version: string;
  name: string;
  definition?: string;
  bezeichnungEingabe: string;
  bezeichnungAusgabe: string;
  hilfetextEingabe?: string;
  hilfetextAusgabe?: string;
}

export interface CodeListMetaData {
  id: string;
  version: string;
  canonicalUri: string;
  canonicalVersionUri: string;
  shortName: string;
  longName: string;
}

export abstract class BaseEnumDataField<T extends string> {
  private _value: T;
  private _variants: Record<T, string>;

  constructor(value: T, variants: Record<T, string>) {
    this._value = value;
    this._variants = variants;
  }

  public get value(): T {
    return this.value;
  }

  public get label(): string {
    return this._variants[this._value];
  }
}

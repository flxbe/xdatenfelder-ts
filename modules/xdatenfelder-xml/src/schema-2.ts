export interface CodeListReference {
  identifier: string;
  version: string;
  canonicalUri: string;
  canonicalVersionUri: string;
}

export interface SelectDescription {
  type: "select";
  content?: string;
  codeListReference: CodeListReference;
}

export interface TextDescription {
  type: "text";
  content?: string;
  constraints?: string;
}

export interface IntegerDescription {
  type: "integer";
  content?: string;
  constraints?: string;
}

export interface LabelDescription {
  type: "label";
  content: string;
}

export interface BoolDescription {
  type: "bool";
}

export interface FileDescription {
  type: "file";
}

export interface DateDescription {
  type: "date";
  content?: string;
}

export interface NumberDescription {
  type: "number";
  content?: string;
  constraints?: string;
}

export interface CurrencyDescription {
  type: "currency";
  content?: string;
  constraints?: string;
}

export interface ObjectDescription {
  type: "object";
}

export type InputDescription =
  | SelectDescription
  | TextDescription
  | IntegerDescription
  | BoolDescription
  | FileDescription
  | DateDescription
  | NumberDescription
  | CurrencyDescription
  | ObjectDescription
  | LabelDescription;

export interface ElementReference {
  type: "dataField" | "dataGroup";
  identifier: string;
  // relatedTo?: string;
  // amount: string
}

export interface BasicData {
  identifier: string;
  version?: string;
  name: string;
  inputLabel: string;
  outputLabel?: string;
  definition?: string;
  description?: string;
  relatedTo?: string;
  // status
  // validSince
  // validUntil
  creator?: string;
  versionInfo?: string;
  // releaseDate
}

export interface Rule extends BasicData {
  script: string;
}

export interface Rule extends BasicData {
  script: string;
}

export interface ElementData extends BasicData {
  // type
  inputHint?: string;
  outputHint?: string;
}

export interface DataField extends ElementData {
  input: InputDescription;
  rules: Array<string>;
}

export interface DataGroup extends ElementData {
  elements: Array<ElementReference>;
  rules: Array<string>;
}

export interface SchemaData extends BasicData {
  elements: Array<ElementReference>;
  rules: Array<string>;
  // help
  // ableitungsmodifikationenStruktur
  // ableitungsmodifikationenRepraesentation
}

export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaError";
  }
}

export interface InvalidInputConstraintsWarning {
  type: "invalidInputConstraints";
  identifier: string;
  value: string;
}

export interface MissingAttributeWarning {
  type: "missingAttribute";
  identifier: string;
  attribute: string;
}

export type Warning = InvalidInputConstraintsWarning | MissingAttributeWarning;

export interface SchemaWarnings {
  schemaWarnings: Warning[];
  dataFieldWarnings: Record<string, Warning[]>;
  dataGroupWarnings: Record<string, Warning[]>;
  ruleWarnings: Record<string, Warning[]>;
}

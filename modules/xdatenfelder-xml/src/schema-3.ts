export interface BaseData {
  identifier: string;
  version: string;
  name: string;
  description?: string;
  definition?: string;
  releaseState: string;
}

export interface ChildRef {
  type: "dataGroup" | "dataField";
  identifier: string;
}

export interface DataGroup extends BaseData {
  rules: string[];
  children: ChildRef[];
}

export interface DataField extends BaseData {}

export interface Rule {
  identifier: string;
  version: string;
  name: string;
  description?: string;
}

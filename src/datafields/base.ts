export interface DataFieldMetaData {
  id: string;
  version: string;
  definition: string;
  bezeichnungEingabe: string;
  bezeichnungAusgabe: string;
  hilfetextEingabe?: string;
  hilfetextAusgabe?: string;
}

export interface CodeListMetaData {
  id: string;
  version: string;
  kennung: string;
}

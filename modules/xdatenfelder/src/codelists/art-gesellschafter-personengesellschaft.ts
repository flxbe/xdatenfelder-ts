export const MetaData = {
  id: "C60000023",
  version: "1",
  canonicalUri:
    "urn:xoev-de:xunternehmen:codeliste:artgesellschafterpersonengesellschaft",
  canonicalVersionUri:
    "urn:xoev-de:xunternehmen:codeliste:artgesellschafterpersonengesellschaft_1",
  longName: "Art eines Gesellschafters einer Personengesellschaft",
  shortName: "artgesellschafterpersonengesellschaft",
};

export type Value = "01" | "02" | "03";

export const Variants: Record<Value, string> = {
  "01": "Gesellschafter (unspezifisch)",
  "02": "Persönlich haftender Gesellschafter",
  "03": "Geschäftsführender Gesellschafter",
};

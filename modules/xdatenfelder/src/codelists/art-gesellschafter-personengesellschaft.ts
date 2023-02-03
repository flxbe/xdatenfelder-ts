export const ArtGesellschafterPersonengesellschaftMetaData = {
  id: "C60000023",
  version: "1",
  canonicalUri:
    "urn:xoev-de:xunternehmen:codeliste:artgesellschafterpersonengesellschaft",
  canonicalVersionUri:
    "urn:xoev-de:xunternehmen:codeliste:artgesellschafterpersonengesellschaft_1",
  longName: "Art eines Gesellschafters einer Personengesellschaft",
  shortName: "artgesellschafterpersonengesellschaft",
};

export type ArtGesellschafterPersonengesellschaftValue = "01" | "02" | "03";

export const ArtGesellschafterPersonengesellschaftVariants: Record<
  ArtGesellschafterPersonengesellschaftValue,
  string
> = {
  "01": "Gesellschafter (unspezifisch)",
  "02": "Persönlich haftender Gesellschafter",
  "03": "Geschäftsführender Gesellschafter",
};

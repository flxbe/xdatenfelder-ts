import { Familienstand } from "./src";

for (const entry of Object.entries(Familienstand.Variants)) {
  const [value, label] = entry;
  console.log(value, label);
}

# xdatenfelder-ts

A simple and fully type-safe implementation of the data-fields defined in `xDatenfelder`.

## Getting Started

### Validate User Input

```js
import { Familienstand } from "xdatenfelder";

const input = "x";

// throws for invalid input
const familienstand = Familienstand.fromString(input);

// or alternatively:
Familienstand.isValid(input);
```

### List All Available Variants

```js
import { Familienstand } from "./src";

for (const entry of Object.entries(Familienstand.Variants)) {
  const [value, label] = entry;
  console.log(value, label);
}
```

Output:

```bash
EA Ehe aufgehoben
GS geschieden
LA aufgehobene Lebenspartnerschaft
LD ledig
LE durch Todeserklärung aufgelöste Lebenspartnerschaft
LP in eingetragener Lebenspartnerschaft
LV durch Tod aufgelöste Lebenspartnerschaft
NB nicht bekannt
VH verheiratet
VW verwitwet
```

## Example: React Select

```ts
import * as React from "react";

import { SelectDataField, Augenfarbe, Familienstand } from "xdatenfelder";

type SelectProps<V extends string, T extends SelectDataField<V>> = {
  Type: {
    new (value: V): T;
    Variants: Record<V, string>;
    fromString: (value: string) => T;
  };
  value: T;
  onChange: (value: T) => void;
};

export default function Select<V extends string, T extends SelectDataField<V>>({
  Type,
  value,
  onChange,
}: SelectProps<V, T>) {
  return (
    <select
      value={value.value}
      onChange={(event) => onChange(Type.fromString(event.target.value))}
    >
      {Object.entries<string>(Type.Variants).map(([value, label]) => {
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function Application() {
  const [familienstand, setFamilienstand] = React.useState<Familienstand>(
    new Familienstand("LD")
  );

  const [augenfarbe, setAugenfarbe] = React.useState<Augenfarbe>(
    new Augenfarbe("22")
  );

  return (
    <div>
      <Select
        Type={Familienstand}
        value={familienstand}
        onChange={setFamilienstand}
      />
      <br />
      <Select Type={Augenfarbe} value={augenfarbe} onChange={setAugenfarbe} />
    </div>
  );
}
```

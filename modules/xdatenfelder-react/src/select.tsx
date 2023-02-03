import * as React from "react";

import { SelectDataField } from "xdatenfelder";

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

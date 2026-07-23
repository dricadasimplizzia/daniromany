"use client";

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[13.5px] text-ink cursor-pointer py-0.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 accent-sage" />
      {label}
    </label>
  );
}

export function CheckGroup({
  options,
  values,
  onToggle,
  columns = 2,
}: {
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((o) => (
        <Checkbox key={o} label={o} checked={values.includes(o)} onChange={() => onToggle(o)} />
      ))}
    </div>
  );
}

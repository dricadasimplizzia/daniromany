const COLOR_VAR: Record<string, string> = {
  sage: "var(--color-sage)",
  brass: "var(--color-brass)",
  brick: "var(--color-brick)",
  teal: "var(--color-teal)",
};

export function SpringDivider({ color = "sage", width = 120 }: { color?: keyof typeof COLOR_VAR; width?: number }) {
  const segs = 10;
  const seg = width / segs;
  const pts: string[] = [];
  for (let i = 0; i <= segs; i++) pts.push(`${i * seg},${i % 2 === 0 ? 6 : 0}`);

  return (
    <svg width={width} height="8" viewBox={`0 0 ${width} 8`}>
      <polyline points={pts.join(" ")} fill="none" stroke={COLOR_VAR[color]} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const BODY =
  "M3,2 H6 V4 H9 V6 H12 V8 H15 V10 H18 V12 H21 V14 H24 V16 H21 V18 H18 V20 H15 V22 H12 V24 H9 V26 H6 V28 H3 Z";

export function NavArrow() {
  return (
    <svg viewBox="0 0 24 30" aria-hidden shapeRendering="crispEdges" className="size-full">
      <rect x={0} y={0} width={3} height={1} fill="var(--color-brand-yellow)" />
      <rect x={0} y={1} width={3} height={29} fill="var(--color-nav-arrow-shade)" />
      <path d={BODY} fill="var(--color-brand-yellow)" />
    </svg>
  );
}

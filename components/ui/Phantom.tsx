"use client";

import "@aejkatappaja/phantom-ui";

export default function Phantom({
  children,
  count,
  countGap,
  className,
}: {
  children: React.ReactNode;
  count?: number;
  countGap?: number;
  className?: string;
}) {
  return (
    <phantom-ui
      loading
      animation="shimmer"
      duration={1.4}
      reveal={0.25}
      background-color="rgba(128,128,128,0.16)"
      shimmer-color="rgba(128,128,128,0.3)"
      count={count}
      count-gap={countGap}
      class={className}
    >
      {children}
    </phantom-ui>
  );
}

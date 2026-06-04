import type { ReactNode } from "react";

interface ResponsiveSwitchProps {
  desktop: ReactNode;
  mobile: ReactNode;
}

export function ResponsiveSwitch({ desktop, mobile }: ResponsiveSwitchProps) {
  return (
    <>
      <div data-viewport="desktop">{desktop}</div>
      <div data-viewport="mobile">{mobile}</div>
    </>
  );
}

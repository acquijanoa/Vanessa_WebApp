"use client";

import { useContentProtection } from "@/hooks/useContentProtection";

type Props = {
  children: React.ReactNode;
  active?: boolean;
};

export function ContentProtectionProvider({ children, active = true }: Props) {
  useContentProtection(active);
  return <>{children}</>;
}

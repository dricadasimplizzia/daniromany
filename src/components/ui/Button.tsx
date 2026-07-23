"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-sage text-white border border-sage",
  ghost: "bg-transparent text-ink border border-border",
  danger: "bg-brick text-white border border-brick",
};

export function Button({
  children,
  variant = "primary",
  small = false,
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  small?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={rest.type ?? "button"}
      {...rest}
      className={`inline-flex items-center gap-1.5 rounded-[10px] font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        small ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-sm"
      } ${VARIANT_CLASS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

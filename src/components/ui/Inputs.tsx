"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseClass =
  "border border-border rounded-lg px-2.5 py-2 text-sm text-ink bg-[#FDFCFA] outline-none focus:border-sage w-full disabled:opacity-60 disabled:cursor-not-allowed";

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${baseClass} ${className}`} />;
}

export function Select({ className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={`${baseClass} ${className}`} />;
}

export function TextArea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${baseClass} resize-y min-h-[70px] ${className}`} />;
}

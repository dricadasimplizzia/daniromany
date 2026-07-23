"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  onClose,
  children,
  width = 560,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: width }}
        className="bg-surface rounded-2xl w-full max-h-[88vh] overflow-y-auto p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-[18px]">
          <h3 className="font-display text-xl text-ink m-0">{title}</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink-muted">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

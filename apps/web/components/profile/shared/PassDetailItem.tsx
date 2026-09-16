"use client";

import Image from "next/image";

interface PassDetailItemProps {
  icon: string;
  label: string;
  value: string;
  className?: string;
  labelColor?: string;
  valueColor?: string;
  multiline?: boolean;
  /** Wrap long values (e.g. email) instead of truncating with ellipsis. */
  wrap?: boolean;
}

export function PassDetailItem({
  icon,
  label,
  value,
  className = "",
  labelColor = "#00F0FF",
  valueColor = "#FFFFFF",
  multiline = false,
  wrap = false,
}: PassDetailItemProps) {
  const isMulti = multiline || value.includes("\n");

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 pl-1 min-w-0 ${className}`}>
      {/* Icon Badge */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
        <Image src={icon} alt="" fill className="object-contain" />
      </div>

      {/* Label and Dynamic DB Value */}
      <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
        <span
          className="font-pixel text-[8px] sm:text-[10px] tracking-wider uppercase truncate"
          style={{ color: labelColor }}
        >
          {label}
        </span>
        <span
          className={`font-pixel tracking-wider uppercase select-text ${
            isMulti
              ? "whitespace-pre-line leading-[1.25] break-words text-[10px] sm:text-[11.5px]"
              : wrap
                ? "whitespace-normal leading-[1.4] break-all text-[11px] sm:text-[13px]"
                : "truncate text-[11px] sm:text-[13px]"
          }`}
          style={{ color: valueColor, textShadow: "0 0 8px rgba(255,255,255,0.2)" }}
          title={value}
        >
          {value || "N/A"}
        </span>
      </div>
    </div>
  );
}

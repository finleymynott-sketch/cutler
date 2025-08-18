"use client";

import type { FC } from "react";
import { palette, noDataColor } from "../lib/colors";

export type LegendProps = {
  title: string;
  breaks: number[]; // length 4
  mode: "abs" | "quant";
};

const formatLabel = (n: number) => n.toFixed(1);

const Legend: FC<LegendProps> = ({ title, breaks, mode }) => {
  const [b0, b1, b2, b3] = breaks;

  return (
    <div
      className="text-[12px] sm:text-[13px] leading-snug rounded-md bg-white/90 backdrop-blur px-3 py-2 shadow ring-1 ring-black/5 text-gray-900"
      role="group"
      aria-label={`${title} legend (${mode === "quant" ? "quantile" : "absolute"})`}
      tabIndex={0}
    >
      <div className="font-medium mb-1">
        {title} <span className="text-gray-500">({mode})</span>
      </div>
      <div className="flex items-center gap-2">
        <Swatch colour={palette[0]} label={`≤ ${formatLabel(b0)}`} />
        <Swatch colour={palette[1]} label={`${formatLabel(b0)}–${formatLabel(b1)}`} />
        <Swatch colour={palette[2]} label={`${formatLabel(b1)}–${formatLabel(b2)}`} />
        <Swatch colour={palette[3]} label={`${formatLabel(b2)}–${formatLabel(b3)}`} />
        <Swatch colour={palette[4]} label={`> ${formatLabel(b3)}`} />
        <Swatch colour={noDataColor} label="No data" />
      </div>
    </div>
  );
};

const Swatch: FC<{ colour: string; label: string }> = ({ colour, label }) => {
  return (
    <div className="flex items-center gap-1" aria-label={label} title={label}>
      <span
        className="inline-block h-3 w-4 rounded-sm ring-1 ring-black/10"
        style={{ backgroundColor: colour }}
        aria-hidden="true"
      />
      <span className="text-gray-700">{label}</span>
    </div>
  );
};

export default Legend;



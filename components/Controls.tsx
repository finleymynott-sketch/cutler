"use client";

import type { FC, ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Indicator = "none" | "readiness" | "exposure" | "safety" | "compute" | "grid";
type Mode = "quant" | "abs";

// Optional zoom handlers kept for backwards compatibility with existing usages
type ControlsProps = {
	onZoomIn?: () => void;
	onZoomOut?: () => void;
};

const validIndicators: Indicator[] = ["none", "readiness", "exposure", "safety", "compute", "grid"];
const validModes: Mode[] = ["quant", "abs"];

const selectBase =
	"rounded-md border border-[color:var(--border)] bg-[var(--panel-2)] text-[var(--text)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] px-2 py-1 text-sm";

const Controls: FC<ControlsProps> = () => {
	const router = useRouter();
	const pathname = usePathname();
	const sp = useSearchParams();

	const [indicator, setIndicator] = useState<Indicator>("none");
	const [mode, setMode] = useState<Mode>("quant");

	// Derive current params as a stable URLSearchParams instance
	const currentParams = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

	useEffect(() => {
		const ind = currentParams.get("ind") as Indicator | null;
		const m = currentParams.get("mode") as Mode | null;
		setIndicator(validIndicators.includes(ind as Indicator) ? (ind as Indicator) : "none");
		setMode(validModes.includes(m as Mode) ? (m as Mode) : "quant");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentParams]);

	function updateUrl(nextIndicator: Indicator, nextMode: Mode) {
		const next = new URLSearchParams(currentParams);
		if (nextIndicator === "none") {
			next.delete("ind");
		} else {
			next.set("ind", nextIndicator);
		}
		next.set("mode", nextMode);
		const qs = next.toString();
		const url = qs ? `${pathname}?${qs}` : pathname;
		router.replace(url, { scroll: false });
	}

	function onIndicatorChange(e: ChangeEvent<HTMLSelectElement>) {
		const value = e.target.value as Indicator;
		setIndicator(value);
		updateUrl(value, mode);
	}

	function onModeChange(e: ChangeEvent<HTMLSelectElement>) {
		const value = e.target.value as Mode;
		setMode(value);
		updateUrl(indicator, value);
	}

	return (
		<div className="rounded-md bg-[var(--panel)]/90 backdrop-blur border border-[color:var(--border)] shadow-sm p-2 text-[13px] text-[var(--text)]">
			<div className="flex items-center gap-2">
				<div className="flex flex-col gap-1">
					<label htmlFor="indicator" className="text-[12px] text-[var(--muted)]">
						Indicator
					</label>
					<select
						id="indicator"
						name="indicator"
						aria-label="Indicator"
						className={selectBase}
						value={indicator}
						onChange={onIndicatorChange}
					>
						<option value="none">None</option>
						<option value="readiness">Readiness</option>
						<option value="exposure">Exposure</option>
						<option value="safety">Safety</option>
						<option value="compute">Compute</option>
						<option value="grid">Grid</option>
					</select>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="scale" className="text-[12px] text-[var(--muted)]">
						Scale
					</label>
					<select
						id="scale"
						name="scale"
						aria-label="Scale"
						className={selectBase}
						value={mode}
						onChange={onModeChange}
					>
						<option value="quant">Quant</option>
						<option value="abs">Abs</option>
					</select>
				</div>
			</div>
		</div>
	);
};

export default Controls;



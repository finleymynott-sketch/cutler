"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import Controls from "./Controls";
import Legend from "./Legend";

export default function Map() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	// Placeholder indicator state. In real app this would come from props/context.
	const indicatorTitle = "Demo indicator";
	const hasIndicatorSelected = false;

	useEffect(() => {
		if (!containerRef.current || mapRef.current) return;

		const style: any = {
			version: 8,
			sources: {
				osm: {
					type: "raster",
					tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
					tileSize: 256,
					attribution:
						"© OpenStreetMap contributors",
				},
			},
			layers: [
				{
					id: "osm",
					type: "raster",
					source: "osm",
				},
			],
		};

		const map = new maplibregl.Map({
			container: containerRef.current,
			style,
			center: [0, 20],
			zoom: 1.6,
			minZoom: 1,
			attributionControl: true,
		});

		map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
		mapRef.current = map;

		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);

	return (
		<div className="relative h-96 w-full">
			<div
				ref={containerRef}
				className="h-full w-full"
				role="application"
				aria-label={`Interactive world map — ${indicatorTitle}`}
				aria-describedby="map-help"
				tabIndex={0}
				aria-busy={false}
			/>
			<p id="map-help" className="sr-only">
				Use arrow keys to pan, plus and minus keys to zoom. Press Tab to reach map controls and legend.
			</p>
			{/* Controls overlay */}
			<div className="pointer-events-none absolute right-2 top-2 z-10">
				<div className="pointer-events-auto">
					<Controls
						onZoomIn={() => mapRef.current?.zoomIn()}
						onZoomOut={() => mapRef.current?.zoomOut()}
					/>
				</div>
			</div>
			{/* Legend overlay */}
			<div className="pointer-events-none absolute left-2 bottom-2 z-10">
				<div className="pointer-events-auto">
					<Legend title="Demo" breaks={[1, 2, 3, 4]} mode="quant" />
				</div>
			</div>
			{/* Attribution chip */}
			<div className="absolute right-2 bottom-2 z-10">
				<div className="rounded-md bg-[var(--panel)]/90 backdrop-blur px-2 py-1 text-[11px] text-[var(--muted)] border border-[color:var(--border)] shadow">
					Demo data • Basemap © OpenStreetMap contributors
				</div>
			</div>
			{/* Empty state */}
			{!hasIndicatorSelected && (
				<div className="absolute inset-x-0 bottom-16 z-10 flex justify-center">
					<div className="rounded-md bg-[var(--panel)]/90 backdrop-blur px-3 py-2 text-sm text-[var(--text)] border border-[color:var(--border)] shadow">
						Choose an indicator to colour the map.
					</div>
				</div>
			)}
		</div>
	);
}



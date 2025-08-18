import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ReactNode } from "react";
import { sans } from "./fonts";

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${sans.variable} antialiased bg-[var(--bg)] text-[var(--text)]`}>
				<a
					href="#main"
					className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-[var(--panel)] focus:px-3 focus:py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
				>
					Skip to content
				</a>
				<header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/20 border-b border-[color:var(--border)]">
					<nav aria-label="Primary" className="mx-auto max-w-6xl px-4">
						<div className="flex h-14 items-center justify-between">
							<a href="/" className="text-base font-semibold tracking-tight">
								Atlas
							</a>
							<ul className="flex items-center gap-6 text-sm">
								<li>
									<a href="#features" className="hover:underline focus:outline-none focus:underline">Features</a>
								</li>
								<li>
									<a href="#map" className="hover:underline focus:outline-none focus:underline">Map</a>
								</li>
								<li>
									<a href="#sources" className="hover:underline focus:outline-none focus:underline">Sources</a>
								</li>
								<li>
									<a href="#contact" className="hover:underline focus:outline-none focus:underline">Contact</a>
								</li>
							</ul>
						</div>
					</nav>
				</header>
				<main id="main">{children}</main>
			</body>
		</html>
	);
}



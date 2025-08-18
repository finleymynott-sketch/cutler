import dynamic from "next/dynamic";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const ClientMap = dynamic(() => import("../components/Map"), { ssr: false });

export default function Page() {
  const year = new Date().getFullYear();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-[color:var(--border)] bg-[var(--panel)] px-6 py-12 sm:px-10 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,0.10), transparent 60%)",
          }}
        />
        <div className="relative text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            AI Atlas — Worlds Apart
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--muted)]">
            Country-level view of AI capacity, labour exposure, and safety presence (demo).
          </p>
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
            <Button asChild>
              <a href="#map">Explore the map</a>
            </Button>
            <Button asChild variant="ghost">
              <a href="#sources">Learn more</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mt-12 sm:mt-16">
        <h2 className="text-center text-xl font-semibold">Built for clarity</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <h3 className="font-medium">Interactive</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Pan, zoom, and explore country details.</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-medium">Responsive</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Optimised for desktop and mobile layouts.</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-medium">Accessible</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Keyboard-friendly with strong focus cues.</p>
          </Card>
        </div>
      </section>

      {/* Map */}
      <section id="map" className="mt-12 sm:mt-16">
        <div className="text-center">
          <h2 className="text-xl font-semibold">World Atlas</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Select an indicator to colour the map.</p>
        </div>
        <Card className="mt-4 p-2">
          <ClientMap />
        </Card>
      </section>

      {/* Sources */}
      <section id="sources" className="mt-12 sm:mt-16">
        <h2 className="text-xl font-semibold">Sources</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Placeholder data; values not final. Basemap © OpenStreetMap contributors. Country boundaries © Natural Earth (public domain).
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-12 sm:mt-16 border-t border-[color:var(--border)] py-6 text-sm text-[var(--muted)]">
        <div className="flex items-center justify-between">
          <span>© {year}</span>
          <a href="#map" className="hover:underline">Back to map ↑</a>
        </div>
      </footer>
    </main>
  );
}



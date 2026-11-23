import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CtaBand, PageHero, RouteCards, SectionHeading, ServiceArea } from "@/components/site/sections";
import { CITIES, HUBS, routeInfo, routeSlug, shortName } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { IMAGES } from "@/lib/images";
import { usePageMeta } from "@/lib/seo";

export default function Routes() {
  usePageMeta(
    "Popular Drop Taxi Routes in Tamil Nadu & Bangalore | One Way Cab Fares",
    "Fixed one way drop taxi fares for Chennai to Bangalore, Chennai to Coimbatore, Bangalore to Madurai, Chennai to Pondicherry and more. Pay only for the drop.",
  );
  return (
    <>
      <PageHero eyebrow="Routes" title="Every lane we" highlight="drive" text="Flat fares on our busiest corridors and per-km pricing on every other pair of our 36 cities. Tap a lane for its full fare sheet." image={IMAGES.scenicHighway} />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RouteCards />
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="More lanes" title="Every lane from" highlight="our six hubs" text="Chennai, Bangalore, Pondicherry, Coimbatore, Madurai and Trichy to every city we serve — and back. Tap a lane for its full fare sheet." />
          <div className="mt-10 space-y-10">
            {HUBS.map((hub) => (
              <div key={hub} data-testid={`hub-group-${shortName(hub).toLowerCase()}`}>
                <h3 className="flex items-center gap-3 text-2xl font-extrabold text-ink">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-taxi font-mono text-sm text-black">{shortName(hub)[0]}</span>
                  {shortName(hub)} drop taxi
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {CITIES.filter((c) => c !== hub).flatMap((c) => [[hub, c], [c, hub]]).map(([a, b]) => {
                    const info = routeInfo(a, b);
                    const slug = routeSlug(a, b);
                    return (
                      <Link key={slug} to={`/routes/${slug}`} className="group flex items-center justify-between gap-2 rounded-xl bg-secondary px-4 py-3 transition-colors duration-200 hover:bg-accent" data-testid={`featured-route-${slug}`}>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-ink">{shortName(a)} to {shortName(b)}</span>
                          <span className="font-mono text-[11px] text-slateink/80">{info?.distance_km} km · {formatINR(info ? Math.min(...Object.values(info.prices)) : 0)}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-leaf transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="Any city pair" title="Not listed?" highlight="Still covered" text="Start a booking from any of these cities and pick your destination." />
          <div className="mt-10"><ServiceArea /></div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

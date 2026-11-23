import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import BookingWizard from "@/components/BookingWizard";
import { CtaBand, Eyebrow, bookHref } from "@/components/site/sections";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HILL_STATIONS, ONE_WAY_MIN_KM, SEO_PAIRS, VEHICLE_TIERS, quoteFare, routeInfoFromSlug, routeSlug, shortName } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { usePageMeta } from "@/lib/seo";

export default function RoutePage() {
  const { slug = "" } = useParams();
  const route = routeInfoFromSlug(slug);

  const from = route ? shortName(route.from_city) : "";
  const to = route ? shortName(route.to_city) : "";
  const minFare = route ? Math.min(...Object.values(route.prices)) : 0;
  const faqs = route
    ? [
        { q: `How much is a ${from} to ${to} drop taxi?`, a: `A one way drop taxi from ${from} to ${to} starts at ${formatINR(minFare)} in a Sedan or Etios (₹15/km, minimum ${ONE_WAY_MIN_KM} km, plus ₹400 batta). SUV or Innova costs ${formatINR(route.prices.suv)} and Innova Crysta ${formatINR(route.prices.innova_crysta)} — no return fare.` },
        { q: `What is the distance from ${from} to ${to} by taxi?`, a: `The road distance from ${from} to ${to} is about ${route.distance_km} km and takes approximately ${route.duration} by cab, depending on traffic and stops.` },
        { q: `Are tolls included in the ${from} to ${to} taxi fare?`, a: "Tolls, state permits and parking are paid at actuals, with receipts. Fuel and driver allowance are already included in the fare." },
        { q: `Can I book a ${from} to ${to} round trip?`, a: `Yes. Choose "Round Trip" in the booking form — the fare covers both ways (minimum 250 km per day) plus driver allowance for each day.` },
      ]
    : [];

  usePageMeta(
    route ? `${from} to ${to} Drop Taxi | One Way Cab from ${formatINR(minFare)}` : "Route not found",
    route
      ? `Book ${from} to ${to} one way drop taxi at ${formatINR(minFare)}. ${route.distance_km} km, ${route.duration}. Pay only for the drop — no return fare. Hatchback, Sedan, SUV & Innova Crysta. 24/7.`
      : "One way drop taxi routes across Tamil Nadu and Bangalore.",
    route
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }
      : undefined,
  );

  if (!route) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center" data-testid="route-not-found">
        <h1 className="text-4xl font-bold text-ink">Route not found</h1>
        <p className="mt-3 text-slateink">We still cover it! Get an instant fare for any city pair.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/book" className="rounded-xl bg-taxi px-6 py-3 font-bold text-black">Get a fare</Link>
          <Link to="/routes" className="rounded-xl border-2 border-ink px-6 py-2.5 font-bold text-ink">All routes</Link>
        </div>
      </section>
    );
  }

  // Related routes: same origin or destination first, from the sitemap set (popular + featured).
  const allPairs = SEO_PAIRS;
  const seen = new Set<string>([slug]);
  const others = allPairs
    .filter(([a, b]) => a === route.from_city || b === route.to_city || a === route.to_city)
    .concat(allPairs)
    .filter(([a, b]) => {
      const k = routeSlug(a, b);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 9)
    .map(([a, b]) => ({ from_city: a, to_city: b }));

  return (
    <>
      <section className="bg-grid-soft relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8 lg:pt-12">
          <div>
            <nav className="flex items-center gap-2 font-mono text-xs text-slateink/70" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">/</span>
              <Link to="/routes" className="hover:text-ink">Routes</Link> <span aria-hidden="true">/</span>
              <span className="text-ink">{from} to {to}</span>
            </nav>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] text-ink sm:text-6xl" data-testid="route-page-title">
              {from} to {to} <span className="marker px-1">Drop Taxi</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slateink">
              A one-way cab from {from} to {to}, billed for the road you travel — never the driver&apos;s trip back.
            </p>
          </div>
          {/* boarding-pass style route summary */}
          <div className="rounded-[2rem] bg-ink p-6 text-white shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sage/60">From</p>
                <p className="font-heading text-2xl font-extrabold">{from}</p>
              </div>
              <span className="lane-dash animate-lane h-[3px] flex-1 rounded-full" aria-hidden="true" />
              <div className="text-right">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sage/60">To</p>
                <p className="font-heading text-2xl font-extrabold">{to}</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
              {[
                { label: "Distance", value: `${route.distance_km} km` },
                { label: "Travel time", value: route.duration },
                { label: "Fare from", value: formatINR(minFare) },
              ].map((f) => (
                <div key={f.label}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage/60">{f.label}</dt>
                  <dd className={`mt-1 font-mono text-lg font-semibold ${f.label === "Fare from" ? "text-taxi" : "text-white"}`} data-testid={`route-fact-${f.label.toLowerCase().replace(" ", "-")}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <div className="order-2 space-y-10 lg:order-1">
            <div>
              <Eyebrow>Fares</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold text-ink">{from} to {to} Taxi Fare</h2>
              <div className="mt-6 overflow-hidden rounded-3xl ring-1 ring-sage">
                <Table data-testid="route-fare-table">
                  <TableHeader>
                    <TableRow className="bg-ink hover:bg-ink">
                      <TableHead className="py-4 pl-5 font-bold text-white">Vehicle</TableHead>
                      <TableHead className="text-right font-bold text-gold">One Way</TableHead>
                      <TableHead className="text-right font-bold text-white">Round Trip (same day)</TableHead>
                      <TableHead className="pr-5 text-right font-bold text-white">Book</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {VEHICLE_TIERS.map((v) => (
                      <TableRow key={v.id} className="odd:bg-white even:bg-secondary">
                        <TableCell className="py-4 pl-5">
                          <span className="block font-bold text-ink">{shortName(v.name)}</span>
                          <span className="text-xs text-slateink/85">{v.capacity} · {formatINR(v.rate_per_km)}/km</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-base font-bold text-ink" data-testid={`route-fare-${v.id}`}>{formatINR(route.prices[v.id])}</TableCell>
                        <TableCell className="text-right font-mono text-slateink">{formatINR(quoteFare(route.from_city, route.to_city, v.id, "round_trip", 1)?.total ?? 0)}</TableCell>
                        <TableCell className="pr-5 text-right">
                          <Link to={bookHref(route.from_city, route.to_city, v.id)} className="inline-flex rounded-lg bg-taxi px-3 py-1.5 text-xs font-extrabold text-black hover:bg-taxi-deep" data-testid={`route-book-${v.id}-btn`}>Book</Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-sm text-slateink/85">One way fares include driver batta (min {ONE_WAY_MIN_KM} km). Tolls, permits &amp; parking at actuals.{HILL_STATIONS.has(route.to_city) || HILL_STATIONS.has(route.from_city) ? " Hill station charges apply on this route." : ""}{route.fixed ? "" : " Distance is approximate."}</p>
            </div>

            <div>
              <Eyebrow>About this route</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold text-ink">One Way Taxi from {from} to {to}</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-slateink">
                Travelling from {from} to {to}? Droptaxi Express runs comfortable one way drop taxis on this {route.distance_km} km
                route every day, around the clock. Our driver picks you up at your doorstep anywhere in {from} and drops you
                at your exact address in {to} in about {route.duration}. Because it is a drop taxi, you pay only for the
                one-way distance — never for the driver&apos;s empty return journey.
              </p>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {["Doorstep pickup & drop", "No return fare", "Verified highway drivers", "Clean AC cabs", "24/7 booking & support", "Free cancellation up to 2 hrs"].map((p) => (
                  <li key={p} className="flex items-center gap-2.5 font-semibold text-ink">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-leaf"><Check className="h-3.5 w-3.5 text-white" aria-hidden="true" /></span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold text-ink">{from} to {to} Taxi — Questions</h2>
              <div className="mt-5 space-y-3">
                {faqs.map((f, i) => (
                  <details key={f.q} className="group rounded-2xl bg-white p-5 ring-1 ring-sage open:ring-taxi" data-testid={`route-faq-${i}`}>
                    <summary className="cursor-pointer list-none text-lg font-bold text-ink">{f.q}</summary>
                    <p className="mt-3 text-[15px] leading-relaxed text-slateink">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:sticky lg:top-32 lg:order-2">
            <BookingWizard key={slug} prefill={{ pickupCity: route.from_city, dropCity: route.to_city }} compact />
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ink">Other Popular Drop Taxi Routes</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((r) => (
              <Link
                key={routeSlug(r.from_city, r.to_city)}
                to={`/routes/${routeSlug(r.from_city, r.to_city)}`}
                className="flex items-center justify-between rounded-2xl bg-secondary px-5 py-4 font-bold text-ink transition-colors duration-200 hover:bg-accent"
                data-testid={`other-route-${routeSlug(r.from_city, r.to_city)}`}
              >
                {shortName(r.from_city)} to {shortName(r.to_city)} Drop Taxi
                <ArrowRight className="h-4 w-4 text-leaf" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

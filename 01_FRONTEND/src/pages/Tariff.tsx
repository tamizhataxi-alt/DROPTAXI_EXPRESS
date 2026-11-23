import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CtaBand, PageHero, SectionHeading, bookHref } from "@/components/site/sections";
import { ONE_WAY_MIN_KM, POPULAR_ROUTES, ROUND_TRIP_MIN_KM_PER_DAY, VEHICLE_TIERS, routeSlug, shortName } from "@/lib/data";
import { usePageMeta } from "@/lib/seo";
import { formatINR } from "@/lib/format";
import { IMAGES, VEHICLE_IMAGES } from "@/lib/images";

const INCLUDED = ["Fuel for the whole trip", "Driver bata (allowance)", "Air-conditioned cab", "Pickup at your gate", "Dispatch desk on call 24/7"];
const EXTRA = ["Toll plazas — exact amount, with receipt", "Karnataka / inter-state permit at cost", "Parking at malls, temples & airports", "Waiting & hill station charges, as applicable"];

export default function Tariff() {
  usePageMeta("Drop Taxi Tariff — One Way Cab Fares per km", "Droptaxi Express tariff: Sedan & Etios ₹15/km, SUV & Innova ₹20/km, Innova Crysta ₹23/km one way (min 130 km). Round trip from ₹14/km (min 250 km/day). No return fare.");
  const [query, setQuery] = useState("");
  const routes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_ROUTES;
    return POPULAR_ROUTES.filter((r) => `${r.from_city} ${r.to_city}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      <PageHero eyebrow="Tariff" title="The rate card," highlight="in plain numbers" text="Five cabs, one clear rate card: one-way and round-trip per-km rates, minimum kilometres and driver batta — all before you book." image={IMAGES.scenicHighway} />

      {/* Per-km tariff */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Per-km rates" title="Choose a cab," highlight="see the math" text="Fare = km × rate + driver bata. A 300 km Sedan drop works out to 300 × ₹15 + ₹400 batta = ₹4,900. Waiting and hill-station charges, if any, are told to you before the trip." />

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {VEHICLE_TIERS.map((v) => (
              <article key={v.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-sage" data-testid={`tariff-card-${v.id}`}>
                <div className="bg-ink px-5 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-taxi">{v.name.match(/\((.*)\)/)?.[1]}</p>
                  <h3 className="mt-1 text-xl font-extrabold text-white">{shortName(v.name)}</h3>
                </div>
                <img src={VEHICLE_IMAGES[v.id]} alt={`${shortName(v.name)} drop taxi`} className="h-28 w-full object-cover" loading="lazy" />
                <div className="grid grid-cols-2 divide-x divide-sage border-b border-sage">
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-leaf">One Way</p>
                    <p className="font-mono text-2xl font-semibold text-ink" data-testid={`tariff-rate-${v.id}`}>{formatINR(v.rate_per_km)}<span className="text-xs text-slateink/70">/km</span></p>
                    <p className="text-[11px] text-slateink/80">Min {ONE_WAY_MIN_KM} KM</p>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-leaf">Round Trip</p>
                    <p className="font-mono text-2xl font-semibold text-ink" data-testid={`tariff-rt-rate-${v.id}`}>{formatINR(v.round_trip_rate)}<span className="text-xs text-slateink/70">/km</span></p>
                    <p className="text-[11px] text-slateink/80">Min {ROUND_TRIP_MIN_KM_PER_DAY} KM/Day</p>
                  </div>
                </div>
                <dl className="space-y-2 p-5 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-slateink/85">Capacity</dt><dd className="text-right font-semibold text-ink">{v.capacity}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slateink/85">Driver Batta</dt><dd className="font-mono font-semibold text-ink" data-testid={`tariff-batta-${v.id}`}>{formatINR(v.driver_allowance)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slateink/85">Waiting</dt><dd className="font-semibold text-ink">As applicable</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slateink/85">Hill Station</dt><dd className="font-semibold text-ink">As applicable</dd></div>
                </dl>
                <div className="mt-auto px-5 pb-5">
                  <Link to={bookHref(undefined, undefined, v.id)} className="flex items-center justify-center gap-2 rounded-xl bg-taxi py-3 text-sm font-extrabold text-black transition-transform duration-200 hover:-translate-y-0.5" data-testid={`tariff-book-${v.id}-btn`}>
                    Book {shortName(v.name)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-7 ring-1 ring-sage">
              <h3 className="text-2xl font-bold text-ink">Already in your fare</h3>
              <ul className="mt-4 space-y-2.5">
                {INCLUDED.map((i) => (
                  <li key={i} className="flex items-center gap-3 text-slateink"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100"><Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /></span>{i}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-sage">
              <h3 className="text-2xl font-bold text-ink">Paid at actual cost</h3>
              <ul className="mt-4 space-y-2.5">
                {EXTRA.map((i) => (
                  <li key={i} className="flex items-center gap-3 text-slateink"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100"><X className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" /></span>{i}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed route fares */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Flat fares" title="Lane prices," highlight="locked in" text="One-way fares from our rate card, batta included — search your city below." />
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slateink/60" aria-hidden="true" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search city, e.g. Madurai" className="h-12 rounded-xl bg-secondary pl-10" data-testid="tariff-route-search-input" />
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl ring-1 ring-sage">
            <Table data-testid="tariff-routes-table">
              <TableHeader>
                <TableRow className="bg-ink hover:bg-ink">
                  <TableHead className="py-4 pl-5 font-bold text-white">Route</TableHead>
                  <TableHead className="font-bold text-white">Distance</TableHead>
                  {VEHICLE_TIERS.map((v) => <TableHead key={v.id} className="text-right font-bold text-taxi-light">{shortName(v.name)}</TableHead>)}
                  <TableHead className="pr-5 text-right font-bold text-white">Book</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((r) => {
                  const slug = `${shortName(r.from_city)}-${shortName(r.to_city)}`.toLowerCase();
                  return (
                    <TableRow key={slug} className="odd:bg-white even:bg-secondary" data-testid={`tariff-route-row-${slug}`}>
                      <TableCell className="py-4 pl-5 font-bold text-ink"><Link to={`/routes/${routeSlug(r.from_city, r.to_city)}`} className="hover:text-leaf hover:underline">{shortName(r.from_city)} → {shortName(r.to_city)}</Link></TableCell>
                      <TableCell className="text-slateink">{r.distance_km} km · {r.duration}</TableCell>
                      {VEHICLE_TIERS.map((v) => <TableCell key={v.id} className="text-right font-mono font-semibold text-ink">{formatINR(r.prices[v.id])}</TableCell>)}
                      <TableCell className="pr-5 text-right">
                        <Link to={bookHref(r.from_city, r.to_city, "sedan")} className="inline-flex rounded-lg bg-taxi px-3 py-1.5 text-xs font-extrabold text-black hover:bg-taxi-deep" data-testid={`tariff-book-route-${slug}-btn`}>Book</Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {routes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-slateink/85" data-testid="tariff-no-routes">
                      No fixed fare for that city yet — <Link to="/book" className="font-bold text-ink underline">get an instant estimate</Link>.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 text-sm text-slateink/85">Going somewhere not on this list? Every pair of our 36 cities is bookable at the per-km rates above.</p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

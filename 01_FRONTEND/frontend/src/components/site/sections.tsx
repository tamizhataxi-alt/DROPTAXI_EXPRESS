import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BadgeIndianRupee, CalendarCheck, Clock3, Headset, Luggage, MapPin, Minus, Plus, ShieldCheck, Sparkles, Star, Users, Zap } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { ReviewsPublic } from "@/lib/types";
import { CITIES, POPULAR_ROUTES, VEHICLE_TIERS, contactInfo, routeSlug, shortName } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { VEHICLE_IMAGES } from "@/lib/images";
import { useMeta } from "@/lib/useMeta";

export function bookHref(from?: string, to?: string, vehicle?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (vehicle) params.set("vehicle", vehicle);
  const qs = params.toString();
  return qs ? `/book?${qs}` : "/book";
}

export function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-leaf/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-leaf ${center ? "mx-auto" : ""}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-leaf" aria-hidden="true" />
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, highlight, text, center = false }: { eyebrow: string; title: string; highlight?: string; text?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto flex max-w-2xl flex-col items-center text-center" : "max-w-2xl"}>
      <Eyebrow center={center}>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] text-ink sm:text-[42px]">
        {title} {highlight && <span className="marker px-1">{highlight}</span>}
      </h2>
      {text && <p className="mt-4 text-base leading-relaxed text-slateink sm:text-lg">{text}</p>}
    </div>
  );
}

// Inner-page header: light, left-aligned, with an image "window" and a lane line.
export function PageHero({ eyebrow, title, highlight, text, image }: { eyebrow: string; title: string; highlight: string; text: string; image: string }) {
  return (
    <section className="bg-grid-soft relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8 lg:pb-16 lg:pt-14">
        <div>
          <nav className="flex items-center gap-2 font-mono text-xs text-slateink/70" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-ink">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{eyebrow}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] text-ink sm:text-6xl">
            {title} <span className="marker px-1">{highlight}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slateink">{text}</p>
        </div>
        <div className="relative hidden lg:block">
          <div className="absolute -left-4 -top-4 h-full w-full rounded-[2rem] bg-taxi" aria-hidden="true" />
          <img src={image} alt="" className="relative h-64 w-full rounded-[2rem] object-cover shadow-card" />
        </div>
      </div>
      <div className="h-3 w-full bg-ink" aria-hidden="true"><div className="lane-dash h-full w-full scale-y-[0.34]" /></div>
    </section>
  );
}

// Fleet: horizontal "garage" cards.
export function FleetGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {VEHICLE_TIERS.map((v, i) => (
        <article key={v.id} className="group grid grid-cols-[120px_1fr] overflow-hidden rounded-3xl bg-white ring-1 ring-sage transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card sm:grid-cols-[180px_1fr]" data-testid={`fleet-card-${v.id}`}>
          <div className="relative overflow-hidden bg-secondary">
            <img src={VEHICLE_IMAGES[v.id]} alt={`${shortName(v.name)} drop taxi`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <span className="absolute left-2 top-2 rounded-md bg-ink px-2 py-0.5 font-mono text-[10px] text-taxi">0{i + 1}</span>
          </div>
          <div className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-bold text-ink">{shortName(v.name)}</h3>
                <p className="text-xs text-slateink/80">{v.name.match(/\((.*)\)/)?.[1]}</p>
              </div>
              <span className="shrink-0 rounded-full bg-taxi/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">{v.tag}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slateink">
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-leaf" aria-hidden="true" />{v.capacity.split("+")[0].trim()}</span>
              <span className="inline-flex items-center gap-1.5"><Luggage className="h-4 w-4 text-leaf" aria-hidden="true" />{v.capacity.split("+")[1]?.trim()}</span>
            </div>
            <div className="mt-auto flex items-end justify-between gap-3 pt-4">
              <p className="font-mono text-3xl font-semibold text-ink">{formatINR(v.rate_per_km)}<span className="text-sm text-slateink/70">/km</span></p>
              <Link to={bookHref(undefined, undefined, v.id)} className="inline-flex h-10 items-center gap-1 rounded-xl bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-black" data-testid={`fleet-book-${v.id}-btn`}>
                Choose <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// Routes as an airport-style departures board.
export function RouteCards({ limit }: { limit?: number }) {
  const routes = limit ? POPULAR_ROUTES.slice(0, limit) : POPULAR_ROUTES;
  return (
    <div className="overflow-hidden rounded-3xl bg-ink shadow-card" data-testid="departures-board">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
        <p className="font-mono text-sm uppercase tracking-[0.25em] text-taxi">Departures · One way</p>
        <p className="hidden items-center gap-2 font-mono text-xs text-leaf sm:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-leaf" /> Cabs available 24/7</p>
      </div>
      <div className="hidden grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr_auto] gap-4 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-sage/50 md:grid">
        <span>Route</span><span>Distance</span><span>Time</span><span>Fare from</span><span className="w-24" />
      </div>
      <ul>
        {routes.map((r) => {
          const slug = `${shortName(r.from_city)}-${shortName(r.to_city)}`.toLowerCase();
          const from = Math.min(...Object.values(r.prices));
          return (
            <li key={slug} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-white/5 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:px-7 md:grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr_auto] md:gap-4" data-testid={`route-card-${slug}`}>
              <div className="min-w-0">
                <Link to={`/routes/${routeSlug(r.from_city, r.to_city)}`} className="font-mono text-lg font-semibold uppercase tracking-wide text-white hover:text-taxi sm:text-xl" data-testid={`route-details-link-${slug}`}>
                  {shortName(r.from_city)} <span className="text-taxi">→</span> {shortName(r.to_city)}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-sage/60 md:hidden">{r.distance_km} km · {r.duration} · from <span className="text-taxi">{formatINR(from)}</span></p>
              </div>
              <span className="hidden font-mono text-sage md:block">{r.distance_km} km</span>
              <span className="hidden items-center gap-1.5 font-mono text-sage md:flex"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{r.duration}</span>
              <span className="hidden font-mono text-lg font-semibold text-taxi md:block">{formatINR(from)}</span>
              <Link to={bookHref(r.from_city, r.to_city, "sedan")} className="inline-flex h-10 w-24 items-center justify-center rounded-xl bg-taxi text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5" data-testid={`book-route-${slug}-btn`}>
                Board
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const WHY = [
  { icon: ShieldCheck, title: "Drivers we vouch for", text: "ID-checked, highway-seasoned and trained to drive like your family is on board." },
  { icon: Zap, title: "60-second booking", text: "Four quick steps, an instant fare and a booking ID before your tea gets cold." },
  { icon: Headset, title: "Humans, 24/7", text: "A real dispatcher picks up — at 3 PM or 3 AM." },
  { icon: MapPin, title: "Door to door", text: "Pickup from your gate, drop at the exact address — no bus-stand detours." },
];

// Bento grid: one hero tile + four small tiles.
export function WhyChoose() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white lg:row-span-2">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-taxi/20 blur-2xl" aria-hidden="true" />
        <Eyebrow>Why Droptaxi Express</Eyebrow>
        <p className="mt-8 font-mono text-sm uppercase tracking-[0.2em] text-sage/70">Return fare on your bill</p>
        <p className="font-heading text-[120px] font-extrabold leading-none text-taxi">₹0</p>
        <p className="mt-4 text-lg leading-relaxed text-sage">
          Regular outstation cabs bill you for the driver&apos;s empty ride home. We don&apos;t. You pay for the kilometres
          you actually travel — that&apos;s it.
        </p>
        <Link to="/tariff" className="mt-8 inline-flex items-center gap-2 font-bold text-taxi hover:underline" data-testid="why-tariff-link">
          See how fares work <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {WHY.map((w) => (
        <div key={w.title} className="rounded-[2rem] bg-white p-7 ring-1 ring-sage transition-shadow duration-300 hover:shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf text-white"><w.icon className="h-5 w-5" aria-hidden="true" /></span>
          <h3 className="mt-5 text-xl font-bold text-ink">{w.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-slateink">{w.text}</p>
        </div>
      ))}
    </div>
  );
}

const STEPS = [
  { icon: MapPin, title: "Drop the pins", text: "Tell us where you start, where you end and when." },
  { icon: BadgeIndianRupee, title: "Pick a ride & price", text: "Compare all five cabs with the full fare shown upfront." },
  { icon: CalendarCheck, title: "Get your Trip Pass", text: "Booking ID on screen, details on WhatsApp, driver call before pickup." },
];

// Road timeline: three stops on a dashed lane.
export function HowItWorks() {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-8 hidden h-4 rounded-full bg-ink md:block" aria-hidden="true">
        <div className="lane-dash animate-lane mx-4 mt-[7px] h-[2px]" />
      </div>
      <ol className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 md:block">
            <span className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-background bg-taxi text-black md:mx-auto">
              <s.icon className="h-7 w-7" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-leaf font-mono text-xs font-semibold text-white">{i + 1}</span>
            </span>
            <div className="md:mt-5 md:text-center">
              <h3 className="text-xl font-bold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slateink">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${size} ${i < Math.round(rating) ? "fill-gold text-gold" : "text-sage"}`} aria-hidden="true" />
      ))}
    </span>
  );
}

export function useReviews() {
  return useQuery({ queryKey: ["reviews"], queryFn: () => apiGet<ReviewsPublic>("/reviews"), retry: false });
}

// Live, verified customer reviews (only completed trips can be rated).
export function Reviews() {
  const { data, isPending } = useReviews();
  const reviews = data?.reviews ?? [];
  if (isPending) return <p className="text-center text-slateink/85">Loading reviews…</p>;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_2fr]">
      <div className="rounded-[2rem] bg-taxi p-8 text-black" data-testid="reviews-summary">
        <p className="font-mono text-xs uppercase tracking-[0.2em]">Rider score</p>
        {data && data.count > 0 ? (
          <>
            <p className="mt-3 font-heading text-7xl font-extrabold">{data.average.toFixed(1)}</p>
            <span className="[&_svg]:fill-black [&_svg]:text-black"><Stars rating={data.average} size="h-5 w-5" /></span>
            <p className="mt-2 text-sm font-semibold">from {data.count} verified trip review{data.count > 1 ? "s" : ""}</p>
          </>
        ) : (
          <p className="mt-3 font-heading text-3xl font-extrabold">Be our first reviewer</p>
        )}
        <Link to="/review" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white" data-testid="rate-your-trip-button">
          <Star className="h-4 w-4" aria-hidden="true" /> Rate your trip
        </Link>
      </div>
      {reviews.length === 0 ? (
        <div className="flex items-center justify-center rounded-[2rem] bg-white p-8 text-center ring-1 ring-sage" data-testid="reviews-empty">
          <p className="text-slateink">Reviews from completed trips appear here — every one tied to a real booking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {reviews.slice(0, 4).map((r) => (
            <figure key={r.id} className="flex flex-col rounded-[2rem] bg-white p-7 ring-1 ring-sage" data-testid={`review-card-${r.booking_id}`}>
              <div className="flex items-center justify-between">
                <Stars rating={r.rating} />
                <span className="rounded-full bg-leaf/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-leaf">Verified trip</span>
              </div>
              <blockquote className="mt-4 flex-1 text-lg font-medium leading-relaxed text-ink">{r.comment ? `“${r.comment}”` : `Rated ${r.rating} out of 5`}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-heading font-bold text-taxi">{r.display_name[0]}</span>
                <span>
                  <span className="block font-bold text-ink">{r.display_name}</span>
                  <span className="font-mono text-xs text-slateink/80">{r.route} · {r.trip_type === "round_trip" ? "Round trip" : "One way"}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

export function ServiceArea() {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {CITIES.map((c) => (
        <Link key={c} to={bookHref(c)} className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-sage transition-[background-color,box-shadow] duration-200 hover:bg-ink hover:text-white" data-testid={`service-area-${shortName(c).toLowerCase()}`}>
          <span className="h-2 w-2 rounded-full bg-leaf transition-colors group-hover:bg-taxi" aria-hidden="true" /> {shortName(c)}
        </Link>
      ))}
    </div>
  );
}

export const FAQS = [
  { q: "How is a drop taxi different from a normal outstation cab?", a: "Normal outstation cabs charge a round trip even when you travel one way, because the car has to return. A drop taxi bills only the one-way distance — we find the driver's next ride, so you never pay for the empty trip back." },
  { q: "What exactly will I pay?", a: "One way: kilometres travelled (minimum 130 km) × your cab's one-way rate, plus driver batta. Round trip: minimum 250 km per day × the round-trip rate, plus batta for each day. Tolls, permits and parking are paid at actual cost with receipts; waiting and hill-station charges, if any, are told to you before the trip." },
  { q: "Which cabs can I choose?", a: "Sedan or Etios at ₹15/km one way (₹14/km round trip), SUV — Tavera, Xylo, Lodgy — or Innova at ₹20/km (₹19/km round trip), and Innova Crysta at ₹23/km (₹22/km round trip). Every cab is AC and driven by a verified driver." },
  { q: "Do you also do round trips?", a: "Yes. Switch the booking form to Round Trip and add a return date. Round trips use the lower round-trip rate, with a 250 km per day minimum and driver batta for each day." },
  { q: "What if my plans change?", a: "Cancel or move your trip at no charge up to 2 hours before pickup — just call or WhatsApp the dispatch desk." },
  { q: "Can you pick me up from the airport?", a: "Of course. We run airport drops and pickups at Chennai, Bangalore, Coimbatore, Madurai and Trichy, and keep an eye on your flight time." },
];

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-sage rounded-[2rem] bg-white px-6 ring-1 ring-sage sm:px-8">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} data-testid={`faq-item-${i}`}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-5 text-left" data-testid={`faq-question-${i}`}>
              <span className="text-base font-bold text-ink sm:text-lg">{f.q}</span>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${isOpen ? "bg-taxi text-black" : "bg-secondary text-ink"}`}>
                {isOpen ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              </span>
            </button>
            {isOpen && <p className="pb-6 pr-12 text-[15px] leading-relaxed text-slateink" data-testid={`faq-answer-${i}`}>{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function CtaBand() {
  const { data: meta } = useMeta();
  const contact = contactInfo(meta);
  return (
    <section className="px-3 pb-14 sm:px-5">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-taxi px-6 py-12 sm:px-12 lg:py-16">
        <Sparkles className="absolute right-10 top-10 hidden h-24 w-24 text-black/10 lg:block" aria-hidden="true" />
        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="max-w-xl text-4xl font-extrabold leading-[1.05] text-black sm:text-5xl">Your drop is one tap away.</h2>
            <p className="mt-3 text-lg font-medium text-black/70">Fixed upfront fare. Zero return charges. Any hour.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/book" className="rounded-2xl bg-ink px-7 py-4 font-heading font-bold text-white transition-transform duration-200 hover:-translate-y-0.5" data-testid="cta-book-button">Book a Drop</Link>
            <a href={contact.tel} className="rounded-2xl bg-white px-7 py-4 font-heading font-bold text-ink transition-transform duration-200 hover:-translate-y-0.5" data-testid="cta-call-button">Call {contact.hotline}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { MessageCircle, Phone } from "lucide-react";
import BookingWizard from "@/components/BookingWizard";
import { CtaBand, Eyebrow, FaqList, FleetGrid, HowItWorks, Reviews, RouteCards, SectionHeading, ServiceArea, WhyChoose, useReviews } from "@/components/site/sections";
import { POPULAR_ROUTES, contactInfo } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { IMAGES } from "@/lib/images";
import { useMeta } from "@/lib/useMeta";
import { usePageMeta } from "@/lib/seo";

function Odometer({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="flex gap-1">
        {value.split("").map((ch, i) => (
          <span key={i} className={`flex h-12 min-w-8 items-center justify-center rounded-lg font-mono text-2xl font-semibold sm:h-14 sm:min-w-10 sm:text-3xl ${/[0-9]/.test(ch) ? "bg-white/[0.07] text-taxi" : "text-sage"}`}>
            {ch}
          </span>
        ))}
      </dd>
      <dt className="mt-2 text-sm text-sage/80">{label}</dt>
    </div>
  );
}

export default function Home() {
  usePageMeta(
    "Droptaxi Express | One Way Drop Taxi in Tamil Nadu & Bangalore",
    "Droptaxi Express — one way drop taxi across Chennai, Bangalore, Coimbatore, Madurai, Salem, Trichy & 12 more cities. Pay one way only, no return fare. Book in 60 seconds, 24/7.",
  );
  const reduceMotion = useReducedMotion();
  const { data: meta } = useMeta();
  const contact = contactInfo(meta);
  const { data: reviewStats } = useReviews();
  const rated = !!reviewStats && reviewStats.count > 0;
  const fade = (delay = 0) => (reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay } });

  return (
    <>
      {/* HERO — mobile shows the booking pass first */}
      <section className="bg-grid-soft relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 top-10 hidden h-[560px] w-[560px] rounded-full bg-taxi/30 blur-3xl lg:block" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-3 pb-12 pt-4 sm:px-6 sm:pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-14">
          <motion.div {...fade()} className="order-2 lg:order-1">
            <Eyebrow>One way drop taxi · Tamil Nadu &amp; Bangalore</Eyebrow>
            <h1 className="mt-5 text-[44px] font-extrabold leading-[0.98] text-ink sm:text-6xl lg:text-7xl">
              Go one way.
              <br />
              <span className="marker px-1">Pay one way.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slateink">
              Droptaxi Express connects 36 cities across Tamil Nadu and Bangalore with AC cabs that bill you only for the
              road you actually travel. No return fare. No surprises.
            </p>

            {/* route ribbon */}
            <Link to="/routes/chennai-to-bangalore" className="group mt-8 flex max-w-lg items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-card ring-1 ring-sage transition-transform duration-200 hover:-translate-y-0.5" data-testid="hero-route-ribbon">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf font-mono text-sm font-semibold text-white">A</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-heading text-sm font-bold text-ink">
                  Chennai <span className="lane-dash animate-lane h-[3px] flex-1 rounded-full bg-ink/80" aria-hidden="true" /> Bangalore
                </span>
                <span className="font-mono text-xs text-slateink/80">350 km · 6 hrs · Sedan</span>
              </span>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink font-mono text-sm font-semibold text-taxi">B</span>
              <span className="font-mono text-lg font-semibold text-ink">{formatINR(POPULAR_ROUTES[1].prices.sedan)}</span>
            </Link>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href={contact.tel} className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-5 font-heading text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5" data-testid="hero-call-button">
                <Phone className="h-4 w-4 text-taxi" aria-hidden="true" /> {contact.hotline}
              </a>
              <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 font-heading text-sm font-bold text-ink ring-1 ring-sage transition-transform duration-200 hover:-translate-y-0.5" data-testid="hero-whatsapp-button">
                <MessageCircle className="h-4 w-4 text-leaf" aria-hidden="true" /> WhatsApp us
              </a>
              {rated && (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink" data-testid="hero-rating-chip">
                  <span className="text-gold">★</span> {reviewStats.average.toFixed(1)} rider score
                </span>
              )}
            </div>
          </motion.div>

          <motion.div {...fade(0.1)} id="booking" className="order-1 lg:order-2">
            <BookingWizard compact />
          </motion.div>
        </div>
      </section>

      {/* ODOMETER BAND */}
      <section className="bg-ink">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          <Odometer value="12000+" label="One-way drops delivered" />
          <Odometer value="36" label="Cities on our network" />
          {rated ? <Odometer value={reviewStats.average.toFixed(1)} label={`Rider score · ${reviewStats.count} reviews`} /> : <Odometer value="100%" label="Verified drivers" />}
          <Odometer value="24/7" label="Dispatch desk open" />
        </dl>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><WhyChoose /></div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="The garage" title="Five cabs." highlight="One honest rate card." text="Pick the size that fits your group and luggage — the per-km price never changes mid-trip." />
            <Link to="/tariff" className="shrink-0 font-bold text-leaf hover:underline" data-testid="home-view-tariff-button">Full tariff →</Link>
          </div>
          <div className="mt-10"><FleetGrid /></div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Busiest lanes" title="Today's" highlight="departures" text="Flat one-way prices on the corridors our riders book the most." />
            <Link to="/routes" className="shrink-0 font-bold text-leaf hover:underline" data-testid="home-all-routes-button">All 390 routes →</Link>
          </div>
          <div className="mt-10"><RouteCards limit={6} /></div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="How it works" title="From pin to pickup in" highlight="three stops" />
          <div className="mt-14"><HowItWorks /></div>
          <div className="mt-12 text-center">
            <Link to="/book" className="inline-flex rounded-2xl bg-taxi px-7 py-4 font-heading font-bold text-black shadow-taxi transition-transform duration-200 hover:-translate-y-0.5" data-testid="home-book-now-button">Start my booking</Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Rider stories" title="Straight from the" highlight="back seat" />
          <div className="mt-10"><Reviews /></div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-20">
        <img src={IMAGES.scenicHighway} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.06]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="Network" title="36 cities," highlight="one lane" text="Tap a city to start a booking from there." />
          <div className="mt-10"><ServiceArea /></div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading eyebrow="Good to know" title="Questions riders" highlight="ask us" text="Still curious? The dispatch desk answers in minutes on call or WhatsApp." />
          </div>
          <FaqList />
        </div>
      </section>

      <CtaBand />
    </>
  );
}

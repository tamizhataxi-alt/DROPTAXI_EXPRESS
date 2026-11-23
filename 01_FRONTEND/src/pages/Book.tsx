import { useSearchParams } from "react-router-dom";
import { BadgeCheck, Headset, ShieldCheck, Wallet } from "lucide-react";
import BookingWizard from "@/components/BookingWizard";
import { PageHero } from "@/components/site/sections";
import { CITIES, VEHICLES, contactInfo } from "@/lib/data";
import { IMAGES } from "@/lib/images";
import { useMeta } from "@/lib/useMeta";
import { usePageMeta } from "@/lib/seo";

const PERKS = [
  { icon: Wallet, title: "One way, one fare", text: "The driver's trip home is never added to your bill." },
  { icon: BadgeCheck, title: "Price before you commit", text: "See the full fare for every cab before you confirm." },
  { icon: ShieldCheck, title: "Checked drivers", text: "ID-verified, highway-seasoned, courteous." },
  { icon: Headset, title: "Someone always answers", text: "Call or WhatsApp the dispatch desk mid-trip." },
];

export default function Book() {
  usePageMeta("Book One Way Drop Taxi Online — Instant Fare", "Book a one way or round trip taxi across Tamil Nadu & Bangalore in under a minute. Instant fare estimate, booking ID and WhatsApp confirmation.");
  const [params] = useSearchParams();
  const { data: meta } = useMeta();
  const contact = contactInfo(meta);
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const vehicle = params.get("vehicle") ?? "";
  const prefill = {
    pickupCity: CITIES.includes(from) ? from : undefined,
    dropCity: CITIES.includes(to) ? to : undefined,
    vehicleId: VEHICLES[vehicle] ? vehicle : undefined,
  };

  return (
    <>
      <PageHero eyebrow="Book Now" title="Book your" highlight="Trip Pass" text="Four quick steps, an instant fare and your booking ID on screen. No sign-up, no app download." image={IMAGES.heroHighway} />
      <section className="py-14 lg:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:px-8">
          {/* key remounts the wizard when a new route link prefills it */}
          <BookingWizard key={params.toString()} prefill={prefill} />
          <aside className="space-y-4 lg:sticky lg:top-32">
            {PERKS.map((p) => (
              <div key={p.title} className="flex gap-4 rounded-3xl bg-white p-5 ring-1 ring-sage">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-taxi text-black">
                  <p.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink">{p.title}</h3>
                  <p className="text-sm text-slateink">{p.text}</p>
                </div>
              </div>
            ))}
            <div className="rounded-3xl bg-ink p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-taxi-light">Rather book by phone?</p>
              <p className="mt-2 font-heading text-2xl font-bold">Call {contact.hotline}</p>
              <p className="mt-1 text-sm text-sage">The dispatch desk takes bookings day and night.</p>
              <a href={contact.tel} className="mt-4 inline-flex rounded-xl bg-taxi px-5 py-3 text-sm font-extrabold text-black" data-testid="book-page-call-button">
                Call Now
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

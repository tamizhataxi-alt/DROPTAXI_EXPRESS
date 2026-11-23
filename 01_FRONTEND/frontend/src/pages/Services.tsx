import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import { CtaBand, HowItWorks, PageHero, SectionHeading } from "@/components/site/sections";
import { IMAGES } from "@/lib/images";
import { usePageMeta } from "@/lib/seo";

const SERVICES = [
  {
    id: "one-way-taxi",
    code: "OW",
    title: "One Way Taxi",
    image: IMAGES.heroHighway,
    text: "City to city, single direction, single fare. Ideal when you are moving, visiting family or heading out for work and don't need the car to wait.",
    points: ["Billed for one direction only", "Flat prices on busy lanes", "Five cab choices"],
  },
  {
    id: "drop-taxi",
    code: "DT",
    title: "Drop Taxi",
    image: IMAGES.scenicHighway,
    text: "Gate-to-gate drops between any two of our 36 cities. Your driver calls ahead, loads your bags and drops you at the exact address.",
    points: ["Doorstep pickup", "Driver call before arrival", "Night drops welcome"],
  },
  {
    id: "airport-taxi",
    code: "AP",
    title: "Airport Taxi",
    image: IMAGES.airport,
    text: "Catch the 5 AM flight without the panic. We serve Chennai, Bangalore, Coimbatore, Madurai and Trichy airports and plan around your flight time.",
    points: ["Flight-time planned pickups", "Space for big suitcases", "Early & late slots"],
  },
  {
    id: "outstation-taxi",
    code: "OS",
    title: "Outstation & Temple Trips",
    image: IMAGES.temple,
    text: "Weekend getaways, temple circuits and hill-station runs — go one way, or switch to round trip and keep the cab for the whole plan.",
    points: ["Round trip option", "SUVs for big families", "Drivers who know the ghats"],
  },
];

export default function Services() {
  usePageMeta(
    "Taxi Services — One Way, Drop, Airport & Outstation",
    "Droptaxi Express services: one way taxi, door-to-door drop taxi, airport taxi and outstation & temple trips across Tamil Nadu and Bangalore.",
  );
  return (
    <>
      <PageHero eyebrow="Services" title="Four ways to" highlight="ride with us" text="Every service runs on the same promise: an upfront fare, a verified driver and no charge for a journey you don't take." image={IMAGES.airport} />

      <section className="py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          {SERVICES.map((s) => (
            <article key={s.id} id={s.id} className="group flex scroll-mt-28 flex-col overflow-hidden rounded-[2rem] bg-white ring-1 ring-sage transition-shadow duration-300 hover:shadow-card" data-testid={`service-${s.id}`}>
              <div className="relative h-56 overflow-hidden">
                <img src={s.image} alt={`${s.title} by Droptaxi Express`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <span className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-taxi font-mono text-sm font-semibold text-black">{s.code}</span>
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h2 className="text-2xl font-extrabold text-ink">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-slateink">{s.text}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {s.points.map((p) => (
                    <li key={p} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-ink">
                      <Check className="h-3.5 w-3.5 text-leaf" aria-hidden="true" /> {p}
                    </li>
                  ))}
                </ul>
                <Link to="/book" className="mt-auto inline-flex items-center gap-1.5 pt-6 font-heading font-bold text-ink hover:text-leaf" data-testid={`service-${s.id}-book-btn`}>
                  Book {s.title} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="How it works" title="From pin to pickup in" highlight="three stops" />
          <div className="mt-14"><HowItWorks /></div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

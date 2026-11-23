import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CITIES, POPULAR_ROUTES, contactInfo, routeSlug, shortName } from "@/lib/data";
import { useMeta } from "@/lib/useMeta";
import { Logo, NAV_LINKS } from "@/components/site/Navbar";

export default function Footer() {
  const { data: meta } = useMeta();
  const contact = contactInfo(meta);

  return (
    <footer className="relative overflow-hidden bg-ink text-sage">
      <div className="lane-dash h-1.5 w-full opacity-90" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo dark />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-sage/80">
              Intercity drop taxis built for one-way travellers. You ride from A to B, you pay for A to B — the
              trip back is never on your bill.
            </p>
            <div className="mt-6 flex gap-2">
              <a href={contact.tel} aria-label="Call" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-taxi transition-colors hover:bg-white/10" data-testid="footer-hotline-link">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-leaf transition-colors hover:bg-white/10" data-testid="footer-whatsapp-link">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href={`mailto:${contact.email}`} aria-label="Email" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white transition-colors hover:bg-white/10" data-testid="footer-email-link">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <nav aria-label="Footer">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-taxi">Explore</h3>
            <ul className="mt-5 space-y-3 text-[15px]">
              {[...NAV_LINKS, { label: "Book Now", to: "/book" }, { label: "Rate Your Trip", to: "/review" }].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-white" data-testid={`footer-${link.label.toLowerCase().replace(/ /g, "-")}-link`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Popular drop taxi routes">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-taxi">Top lanes</h3>
            <ul className="mt-5 space-y-3 text-[15px]">
              {POPULAR_ROUTES.slice(0, 6).map((r) => (
                <li key={`${r.from_city}-${r.to_city}`}>
                  <Link to={`/routes/${routeSlug(r.from_city, r.to_city)}`} className="transition-colors hover:text-white">
                    {shortName(r.from_city)} → {shortName(r.to_city)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-taxi">Dispatch desk</h3>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li className="font-heading text-2xl font-bold text-white">{contact.hotline}</li>
              <li className="break-all">{contact.email}</li>
              <li className="flex items-start gap-2" data-testid="footer-address"><MapPin className="mt-1 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" /> <span>{contact.address}<span className="block text-xs text-white/60">Serving Tamil Nadu, Pondicherry &amp; Bangalore, 24/7</span></span></li>
            </ul>
          </div>
        </div>

        <p className="mt-14 text-xs leading-relaxed text-sage/50">
          <span className="font-semibold text-sage/70">Drop taxi coverage: </span>
          {CITIES.map((c) => `${shortName(c)} drop taxi`).join(" · ")}
        </p>

        <p className="pointer-events-none mt-10 select-none whitespace-nowrap font-heading text-[16vw] font-extrabold leading-none tracking-tighter text-white/[0.04] lg:text-[11rem]" aria-hidden="true">
          DROPTAXI EXPRESS
        </p>
        <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-sage/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Droptaxi Express. All rights reserved.</p>
          <Link to="/admin" className="hover:text-taxi" data-testid="footer-admin-link">Admin Login</Link>
        </div>
      </div>
    </footer>
  );
}

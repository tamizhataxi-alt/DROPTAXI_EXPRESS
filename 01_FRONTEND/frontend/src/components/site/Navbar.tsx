import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, Phone, X } from "lucide-react";
import { contactInfo } from "@/lib/data";
import { useMeta } from "@/lib/useMeta";

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Tariff", to: "/tariff" },
  { label: "Routes", to: "/routes" },
  { label: "Services", to: "/services" },
  { label: "Contact", to: "/contact" },
];

// Official Droptaxi Express logo (public/logo.png); `dark` swaps in the white-text version for dark backgrounds.
export function Logo({ dark = false, className = "h-7 sm:h-10" }: { dark?: boolean; className?: string }) {
  return (
    <img
      src={dark ? "/logo-light.png" : "/logo.png"}
      alt="Droptaxi Express"
      width={1822}
      height={299}
      className={`${className} w-auto`}
      data-testid={dark ? "brand-logo-light" : "brand-logo"}
    />
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: meta } = useMeta();
  const contact = contactInfo(meta);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color] duration-200 ${
      isActive ? "bg-ink text-white" : "text-slateink hover:bg-secondary hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="mx-auto max-w-7xl rounded-2xl border border-sage/70 bg-white/85 shadow-[0_10px_40px_-18px_rgba(48,50,61,0.35)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
          <Link to="/" aria-label="Droptaxi Express home" data-testid="navbar-logo-link">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === "/"} className={linkClass} data-testid={`nav-${link.label.toLowerCase()}-link`}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={contact.tel}
              aria-label={`Call ${contact.hotline}`}
              className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-ink transition-colors hover:bg-secondary md:inline-flex"
              data-testid="navbar-hotline-link"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf/10 text-leaf">
                <Phone className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden xl:inline">{contact.hotline}</span>
            </a>
            <Link
              to="/book"
              className="group inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-xl bg-taxi px-3 font-heading text-sm font-bold text-black shadow-taxi transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 sm:px-5"
              data-testid="nav-book-now-button"
            >
              Book Now
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:rotate-45" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-secondary lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              data-testid="navbar-menu-toggle"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="grid gap-1 border-t border-sage/60 p-3 lg:hidden" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `rounded-xl px-4 py-3 text-base font-semibold ${isActive ? "bg-ink text-white" : "text-ink hover:bg-secondary"}`}
                data-testid={`mobile-nav-${link.label.toLowerCase()}-link`}
              >
                {link.label}
              </NavLink>
            ))}
            <a href={contact.tel} className="flex items-center gap-2 rounded-xl px-4 py-3 font-bold text-leaf">
              <Phone className="h-4 w-4" aria-hidden="true" /> {contact.hotline}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}

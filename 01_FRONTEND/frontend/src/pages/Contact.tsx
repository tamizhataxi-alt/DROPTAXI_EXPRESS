import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ApiError, apiPost } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero, SectionHeading, ServiceArea } from "@/components/site/sections";
import { contactInfo } from "@/lib/data";
import { IMAGES } from "@/lib/images";
import type { Enquiry } from "@/lib/types";
import { useMeta } from "@/lib/useMeta";
import { usePageMeta } from "@/lib/seo";

const EMPTY = { name: "", phone: "", email: "", message: "" };

export default function Contact() {
  usePageMeta("Contact Droptaxi Express — 24/7 Drop Taxi Booking", "Call, WhatsApp or message Droptaxi Express for one way drop taxi bookings across Tamil Nadu & Bangalore. Open 24 hours, 7 days.");
  const { data: meta } = useMeta();
  const contact = contactInfo(meta);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState<Enquiry | null>(null);

  const send = useMutation({
    mutationFn: () => apiPost<Enquiry>("/enquiries", form),
    onSuccess: (enquiry) => {
      setSent(enquiry);
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      toast.success("Message sent — we'll call you back shortly");
    },
    onError: (err) => {
      const isPhone = err instanceof ApiError && JSON.stringify(err.body ?? "").includes("mobile");
      toast.error(isPhone ? "Enter a valid 10-digit mobile number" : "Could not send. Please call or WhatsApp us.");
    },
  });

  const CARDS = [
    { icon: Phone, title: "Call dispatch", value: contact.hotline, href: contact.tel, testId: "contact-call-card" },
    { icon: MessageCircle, title: "WhatsApp", value: "Message us anytime", href: `https://wa.me/${contact.whatsapp}`, testId: "contact-whatsapp-card" },
    { icon: Mail, title: "Email", value: contact.email, href: `mailto:${contact.email}`, testId: "contact-email-card" },
    { icon: Clock3, title: "Desk hours", value: "Always open — 24 × 7", href: undefined, testId: "contact-hours-card" },
  ];

  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to the" highlight="dispatch desk" text="Real people, round the clock. Call for the fastest booking, WhatsApp for quick questions, or leave a note below." image={IMAGES.chennai} />

      <section className="py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:px-8">
          <div>
            <SectionHeading eyebrow="Reach us" title="Pick your" highlight="channel" text="For instant bookings, calling or WhatsApp is fastest. For anything else, drop us a message and we'll call you back." />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CARDS.map((c) => {
                const body = (
                  <>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.icon === MessageCircle ? "bg-whatsapp text-white" : "bg-taxi text-black"}`}>
                      <c.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="mt-4 block text-xs font-bold uppercase tracking-[0.18em] text-slateink/85">{c.title}</span>
                    <span className="mt-1 block break-words text-lg font-bold text-ink">{c.value}</span>
                  </>
                );
                return c.href ? (
                  <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-sage transition-[transform] duration-200 hover:-translate-y-1 hover:ring-taxi" data-testid={c.testId}>
                    {body}
                  </a>
                ) : (
                  <div key={c.title} className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-sage" data-testid={c.testId}>{body}</div>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-3xl bg-ink p-6 text-white">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-taxi-light" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-sage">
                <span className="block text-base font-bold text-white" data-testid="contact-address">Office: {contact.address}</span>
                <span className="block pt-1">Serving Tamil Nadu, Pondicherry &amp; Bangalore:</span>
                Chennai · Bangalore · Coimbatore · Madurai · Salem · Trichy · Tirunelveli · Vellore · Pondicherry · Hosur and more.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-sage">
            <div className="h-2 bg-taxi" aria-hidden="true" />
            <div className="p-6 sm:p-8">
              {sent ? (
                <div className="py-10 text-center" data-testid="enquiry-success-view">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden="true" />
                  <h2 className="mt-3 text-3xl font-bold text-ink">Thank you, {sent.name}!</h2>
                  <p className="mt-2 text-slateink">We've received your message and will call +91 {sent.phone} shortly.</p>
                  <button type="button" onClick={() => setSent(null)} className="mt-6 rounded-xl border-2 border-ink px-5 py-2.5 font-bold text-ink hover:bg-ink hover:text-white" data-testid="enquiry-send-another-btn">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="space-y-4" data-testid="enquiry-form">
                  <h2 className="text-3xl font-bold text-ink">Leave us a note</h2>
                  <p className="text-sm text-slateink/85">Corporate travel, group trips or a fare question — we usually reply within minutes.</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="enquiry-name">Full Name</Label>
                      <Input id="enquiry-name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="h-12 rounded-xl" data-testid="enquiry-name-input" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="enquiry-phone">Mobile Number</Label>
                      <Input id="enquiry-phone" required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" title="10-digit Indian mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit mobile" className="h-12 rounded-xl" data-testid="enquiry-phone-input" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="enquiry-email">Email (optional)</Label>
                    <Input id="enquiry-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="h-12 rounded-xl" data-testid="enquiry-email-input" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="enquiry-message">Message</Label>
                    <Textarea id="enquiry-message" required minLength={5} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us your trip details or question…" className="rounded-xl" data-testid="enquiry-message-input" />
                  </div>
                  <button type="submit" disabled={send.isPending} className="w-full rounded-xl bg-taxi py-4 font-extrabold uppercase tracking-wide text-black shadow-taxi transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60" data-testid="enquiry-submit-btn">
                    {send.isPending ? "Sending…" : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="Network" title="Cities we" highlight="cover" />
          <div className="mt-10"><ServiceArea /></div>
        </div>
      </section>
    </>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ArrowUpDown, Check, CheckCircle2, Luggage, MessageCircle, Users } from "lucide-react";
import { ApiError, apiPost } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROUND_TRIP_MIN_KM_PER_DAY, TIME_SLOTS, VEHICLE_TIERS, contactInfo, shortName, tripDays } from "@/lib/data";
import LocationInput from "@/components/LocationInput";
import { bookingWhatsAppText, formatINR, whatsappLink } from "@/lib/format";
import { VEHICLE_IMAGES } from "@/lib/images";
import type { Booking, LeadResponse, QuoteOptions, TripType } from "@/lib/types";
import { useMeta } from "@/lib/useMeta";

export interface WizardPrefill {
  pickupCity?: string;
  dropCity?: string;
  vehicleId?: string;
  tripType?: TripType;
}

const STEPS = ["Trip", "Vehicle", "Details", "Confirm"];
const PHONE_RE = /^[6-9]\d{9}$/;

function errorDetail(error: unknown, fallback = "Could not place the booking. Please try again or call us."): string {
  if (error instanceof ApiError && error.body && typeof error.body === "object" && "detail" in error.body) {
    const detail = (error.body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object" && "msg" in detail[0]) {
      return String((detail[0] as { msg: unknown }).msg).replace(/^Value error, /, "");
    }
  }
  return fallback;
}

function FieldShell({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-sage bg-white px-3 pb-2 pt-2 transition-colors focus-within:border-taxi focus-within:ring-2 focus-within:ring-taxi/30">
      <label htmlFor={htmlFor} className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slateink/85">
        {label}
      </label>
      {children}
    </div>
  );
}

const bareInput = "h-8 border-0 bg-transparent px-0 text-[15px] font-semibold text-ink shadow-none focus-visible:ring-0";
const bareTrigger = "h-8 w-full border-0 bg-transparent px-0 text-[15px] font-semibold text-ink shadow-none focus-visible:ring-0";

export default function BookingWizard({ prefill = {}, compact = false }: { prefill?: WizardPrefill; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { data: meta } = useMeta();
  const contact = contactInfo(meta);

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState({
    pickup_city: prefill.pickupCity ?? "",
    drop_city: prefill.dropCity ?? "",
    pickup_place_id: prefill.pickupCity ? `city:${prefill.pickupCity}` : "",
    drop_place_id: prefill.dropCity ? `city:${prefill.dropCity}` : "",
    trip_type: (prefill.tripType ?? "one_way") as TripType,
    pickup_date: "",
    return_date: "",
    pickup_time: "",
    phone: "",
    vehicle_id: prefill.vehicleId ?? "sedan",
    customer_name: "",
    pickup_address: "",
    drop_address: "",
    notes: "",
  });
  const set = (field: keyof typeof form) => (value: string) => {
    setError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isRound = form.trip_type === "round_trip";
  const days = isRound ? tripDays(form.pickup_date, form.return_date) : 1;
  const [options, setOptions] = useState<QuoteOptions | null>(null);
  const quote = options?.quotes.find((q) => q.vehicle_id === form.vehicle_id) ?? null;
  const tripPayload = () => ({
    customer_name: form.customer_name.trim(),
    phone: form.phone,
    pickup_city: form.pickup_city,
    drop_city: form.drop_city,
    pickup_place_id: form.pickup_place_id,
    drop_place_id: form.drop_place_id,
    pickup_date: form.pickup_date,
    pickup_time: form.pickup_time,
    vehicle_id: form.vehicle_id,
    trip_type: form.trip_type,
    return_date: form.return_date,
  });

  const fetchOptions = useMutation({
    mutationFn: () =>
      apiPost<QuoteOptions>("/quote/options", {
        from_city: form.pickup_city,
        to_city: form.drop_city,
        from_place_id: form.pickup_place_id,
        to_place_id: form.drop_place_id,
        trip_type: form.trip_type,
        days,
      }),
    onSuccess: (result) => {
      setOptions(result);
      setForm((prev) => ({
        ...prev,
        pickup_address: prev.pickup_address || (prev.pickup_place_id.startsWith("city:") ? "" : prev.pickup_city),
        drop_address: prev.drop_address || (prev.drop_place_id.startsWith("city:") ? "" : prev.drop_city),
      }));
      setStep(1);
    },
    onError: (err) => setError(errorDetail(err, "Could not calculate the fare. Please check the locations or call us.")),
  });

  // Owner gets a booking-enquiry email as soon as a vehicle is chosen (fire and forget).
  const sendLead = useMutation({
    mutationFn: () => apiPost<LeadResponse>("/leads", tripPayload()),
  });

  const submit = useMutation({
    mutationFn: () =>
      apiPost<Booking>("/bookings", {
        ...tripPayload(),
        pickup_address: form.pickup_address,
        drop_address: form.drop_address,
        notes: form.notes,
      }),
    onSuccess: (created) => {
      setBooking(created);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(`Booking ${created.id} received`);
    },
    onError: (err) => setError(errorDetail(err)),
  });

  const next = () => {
    if (step === 0) {
      if (!form.pickup_place_id) return setError("Search and pick your pickup location from the list.");
      if (!form.drop_place_id) return setError("Search and pick your drop location from the list.");
      if (form.pickup_place_id === form.drop_place_id) return setError("Pickup and drop location must be different.");
      if (!form.pickup_date || !form.pickup_time) return setError("Choose your pickup date and time.");
      if (meta?.today && form.pickup_date < meta.today) return setError("Pickup date cannot be in the past.");
      if (isRound && !form.return_date) return setError("Choose your return date.");
      if (isRound && form.return_date < form.pickup_date) return setError("Return date cannot be before the pickup date.");
      if (isRound && days > 30) return setError("Round trips can be up to 30 days.");
      if (form.customer_name.trim().length < 2) return setError("Enter your name.");
      if (!PHONE_RE.test(form.phone)) return setError("Enter a valid 10-digit mobile number.");
      setError("");
      return fetchOptions.mutate();
    }
    if (step === 1) sendLead.mutate();
    setError("");
    setStep((s) => s + 1);
  };

  const handleDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.pickup_address.trim().length < 4 || form.drop_address.trim().length < 4)
      return setError("Enter pickup and drop addresses (min 4 characters).");
    submit.mutate();
  };

  const restart = () => {
    setBooking(null);
    setStep(0);
    setForm((prev) => ({ ...prev, customer_name: "", pickup_address: "", drop_address: "", notes: "", pickup_date: "", return_date: "", pickup_time: "" }));
  };

  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 }, transition: { duration: 0.22 } };

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-30px_rgba(48,50,61,0.45)] ring-1 ring-sage" data-testid="booking-wizard">
      {/* Trip Pass header strip */}
      <div className="relative bg-ink px-5 pb-6 pt-5 text-white sm:px-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-taxi">DX · Trip Pass</span>
          <span className="rounded-full bg-leaf/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#4ade80]">Instant fare</span>
        </div>
        <h2 className={`mt-2 ${compact ? "text-xl sm:text-2xl" : "text-2xl"} font-extrabold`}>{isRound ? "Plan your round trip" : "Where are you dropping?"}</h2>
        <p className="mt-0.5 text-sm text-sage/80">{isRound ? "Out and back in one booking" : "One way fare · no return charges"}</p>
        <div className="ticket-notch absolute inset-x-0 -bottom-3 h-6 bg-white" aria-hidden="true" />
      </div>
      <div className={compact ? "px-4 pb-4 pt-2 sm:px-6 sm:pb-6" : "px-6 pb-6 pt-3 sm:px-8 sm:pb-8"}>
        {/* Step indicator */}
        <ol className="mt-1 flex items-center justify-between" aria-label="Booking steps">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200 ${
                      done ? "bg-ink text-taxi-light" : active ? "bg-taxi text-black ring-4 ring-taxi/25" : "bg-secondary text-slateink/60"
                    }`}
                    data-testid={`wizard-step-${i + 1}`}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${active || done ? "text-ink" : "text-slateink/60"}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={`mx-1.5 mb-5 h-0.5 flex-1 rounded-full ${i < step ? "bg-ink" : "bg-sage"}`} aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>

        <div className={compact ? "mt-4 sm:mt-6" : "mt-6"}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="trip" {...motionProps} className="space-y-3">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1" role="radiogroup" aria-label="Trip type">
                  {([["one_way", "One Way"], ["round_trip", "Round Trip"]] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={form.trip_type === value}
                      onClick={() => set("trip_type")(value)}
                      className={`rounded-lg py-2.5 text-sm font-bold transition-[background-color,color,box-shadow] duration-200 ${
                        form.trip_type === value ? "bg-taxi text-black shadow-sm" : "text-slateink/85 hover:text-ink"
                      }`}
                      data-testid={`trip-type-${value.replace("_", "-")}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative rounded-xl border border-sage bg-white">
                  <div className="border-b border-dashed border-sage">
                    <LocationInput
                      id="wizard-pickup-location"
                      label="Pickup Location"
                      value={form.pickup_city}
                      placeId={form.pickup_place_id}
                      placeholder="Search area, street or landmark"
                      dotClassName="border-2 border-emerald-500"
                      testId="pickup-location-input"
                      onType={(text) => { setError(""); setForm((p) => ({ ...p, pickup_city: text, pickup_place_id: "" })); }}
                      onSelect={(pl) => { setError(""); setForm((p) => ({ ...p, pickup_city: pl.label, pickup_place_id: pl.place_id })); }}
                    />
                  </div>
                  <LocationInput
                    id="wizard-drop-location"
                    label="Drop Location"
                    value={form.drop_city}
                    placeId={form.drop_place_id}
                    placeholder="Search area, street or landmark"
                    dotClassName="bg-red-500"
                    testId="drop-location-input"
                    onType={(text) => { setError(""); setForm((p) => ({ ...p, drop_city: text, drop_place_id: "" })); }}
                    onSelect={(pl) => { setError(""); setForm((p) => ({ ...p, drop_city: pl.label, drop_place_id: pl.place_id })); }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, pickup_city: p.drop_city, drop_city: p.pickup_city, pickup_place_id: p.drop_place_id, drop_place_id: p.pickup_place_id }))}
                    className="absolute right-12 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-sage bg-white text-ink shadow-sm transition-transform duration-200 hover:rotate-180"
                    aria-label="Swap pickup and drop"
                    data-testid="swap-cities-btn"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldShell label="Pickup Date" htmlFor="wizard-date">
                    <Input
                      id="wizard-date"
                      type="date"
                      min={meta?.today}
                      value={form.pickup_date}
                      onChange={(e) => set("pickup_date")(e.target.value)}
                      className={bareInput}
                      data-testid="pickup-date-input"
                    />
                  </FieldShell>
                  <FieldShell label="Pickup Time" htmlFor="wizard-time">
                    <Select value={form.pickup_time} onValueChange={set("pickup_time")}>
                      <SelectTrigger id="wizard-time" className={bareTrigger} data-testid="pickup-time-select">
                        <SelectValue>
                          {(v: string | null) =>
                            v ? TIME_SLOTS.find((t) => t.value === v)?.label : <span className="text-slateink/60">Select time</span>
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldShell>
                </div>

                {isRound && (
                  <FieldShell label="Return Date" htmlFor="wizard-return-date">
                    <Input
                      id="wizard-return-date"
                      type="date"
                      min={form.pickup_date || meta?.today}
                      value={form.return_date}
                      onChange={(e) => set("return_date")(e.target.value)}
                      className={bareInput}
                      data-testid="return-date-input"
                    />
                  </FieldShell>
                )}

                <div className="grid grid-cols-2 gap-3">
                <FieldShell label="Your Name" htmlFor="wizard-name">
                  <Input id="wizard-name" value={form.customer_name} onChange={(e) => set("customer_name")(e.target.value)} placeholder="Full name" autoComplete="name" className={bareInput} data-testid="booking-name-input" />
                </FieldShell>
                <FieldShell label="Mobile Number" htmlFor="wizard-phone">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-slateink/85">+91</span>
                    <Input
                      id="wizard-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit number"
                      value={form.phone}
                      onChange={(e) => set("phone")(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={bareInput}
                      data-testid="phone-input"
                    />
                  </div>
                </FieldShell>
                </div>

              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="vehicle" {...motionProps} className="space-y-2.5">
                {options && (
                  <p className="rounded-lg bg-accent px-3 py-2 text-center text-sm font-semibold text-ink" data-testid="trip-distance-hint">
                    {options.road_km} km road distance · approx. {options.duration} one way
                    {isRound ? ` · ${options.quotes[0]?.distance_km ?? 0} km billed both ways` : ""}
                  </p>
                )}
                {VEHICLE_TIERS.map((v) => {
                  const q = options?.quotes.find((x) => x.vehicle_id === v.id);
                  const selected = form.vehicle_id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => set("vehicle_id")(v.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 ${
                        selected ? "border-taxi bg-accent" : "border-sage bg-white hover:border-taxi/50"
                      }`}
                      data-testid={`vehicle-option-${v.id}`}
                    >
                      <img src={VEHICLE_IMAGES[v.id]} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-ink">{shortName(v.name)}</span>
                        <span className="flex items-center gap-2.5 text-xs text-slateink/85">
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" aria-hidden="true" />{v.capacity.split("+")[0].trim()}</span>
                          <span className="inline-flex items-center gap-1"><Luggage className="h-3 w-3" aria-hidden="true" />{v.capacity.split("+")[1]?.trim()}</span>
                        </span>
                        <span className="text-xs font-semibold text-slateink/85">{formatINR(isRound ? v.round_trip_rate : v.rate_per_km)}/km</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-mono text-lg font-bold text-ink">{q ? formatINR(q.total) : "—"}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slateink/60">{isRound ? "round trip" : "one way"}</span>
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {step === 2 && (
              <motion.form key="details" {...motionProps} onSubmit={handleDetails} className="space-y-3" id="wizard-details-form" data-testid="booking-details-form">
                {quote && (
                  <div className="rounded-2xl bg-ink p-4 text-white" data-testid="fare-breakdown-card">
                    <div className="flex items-center justify-between text-sm">
                      <span className="min-w-0 truncate font-semibold">{shortName(quote.from_city).split(",")[0]} → {shortName(quote.to_city).split(",")[0]}</span>
                      <span className="shrink-0 pl-2 text-sage">{quote.distance_km} km · {shortName(quote.vehicle_name)}</span>
                    </div>
                    <dl className="mt-3 space-y-1 text-sm text-sage">
                      <div className="flex justify-between"><dt>Base fare ({quote.distance_km} km × {formatINR(quote.rate_per_km)})</dt><dd className="font-mono">{formatINR(quote.base_fare)}</dd></div>
                      <div className="flex justify-between"><dt>Driver allowance{isRound ? ` (${quote.days} day${quote.days > 1 ? "s" : ""})` : ""}</dt><dd className="font-mono">{formatINR(quote.driver_allowance)}</dd></div>
                    </dl>
                    <div className="mt-2 flex items-baseline justify-between border-t border-white/15 pt-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-taxi-light">Estimated Total</span>
                      <span className="font-mono text-3xl font-bold text-taxi-light" data-testid="fare-total">{formatINR(quote.total)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slateink/60">
                      {isRound
                        ? `Round trip: both ways, minimum ${ROUND_TRIP_MIN_KM_PER_DAY} km per day.`
                        : quote.fixed_price ? "Fixed price route." : "Estimated fare."}{" "}
                      Tolls, permits &amp; parking at actuals.
                    </p>
                  </div>
                )}
                <FieldShell label="Pickup Address" htmlFor="wizard-pickup-address">
                  <Input id="wizard-pickup-address" value={form.pickup_address} onChange={(e) => set("pickup_address")(e.target.value)} placeholder="House no, street, landmark" className={bareInput} data-testid="booking-pickup-address-input" />
                </FieldShell>
                <FieldShell label="Drop Address" htmlFor="wizard-drop-address">
                  <Input id="wizard-drop-address" value={form.drop_address} onChange={(e) => set("drop_address")(e.target.value)} placeholder="House no, street, landmark" className={bareInput} data-testid="booking-drop-address-input" />
                </FieldShell>
                <FieldShell label="Notes (optional)" htmlFor="wizard-notes">
                  <Input id="wizard-notes" value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Luggage, kids, temple stop…" className={bareInput} data-testid="booking-notes-input" />
                </FieldShell>
              </motion.form>
            )}

            {step === 3 && booking && (
              <motion.div key="done" {...motionProps} className="text-center" data-testid="booking-success-view">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
                <h3 className="mt-2 text-2xl font-bold text-ink">Booking Received!</h3>
                <p className="mt-1 text-sm text-slateink/85">We will call +91 {booking.phone} shortly to confirm your driver.</p>
                {booking.whatsapp_status === "sent" && (
                  <p className="mt-1 text-sm font-semibold text-emerald-700" data-testid="booking-whatsapp-sent">Your receipt is on its way to your WhatsApp.</p>
                )}
                <div className="mt-4 rounded-2xl border-2 border-dashed border-taxi bg-accent p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slateink/85">Booking ID</p>
                  <p className="font-mono text-3xl font-black text-ink" data-testid="booking-id-success">{booking.id}</p>
                </div>
                <dl className="mt-4 space-y-1.5 text-left text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slateink/85">Trip</dt><dd className="text-right font-semibold text-ink" data-testid="booking-success-trip">{booking.pickup_city.split(",")[0]} → {booking.drop_city.split(",")[0]} · {booking.trip_type === "round_trip" ? "Round trip" : "One way"}</dd></div>
                  {booking.road_km > 0 && (
                    <div className="flex justify-between gap-3"><dt className="text-slateink/85">Distance</dt><dd className="font-semibold text-ink" data-testid="booking-success-distance">{booking.road_km} km · {booking.duration}</dd></div>
                  )}
                  {booking.trip_type === "round_trip" && (
                    <div className="flex justify-between gap-3"><dt className="text-slateink/85">Return</dt><dd className="font-semibold text-ink">{booking.return_date} · {booking.days} day{booking.days > 1 ? "s" : ""}</dd></div>
                  )}
                  <div className="flex justify-between gap-3"><dt className="text-slateink/85">Pickup</dt><dd className="font-semibold text-ink">{booking.pickup_date} · {TIME_SLOTS.find((t) => t.value === booking.pickup_time)?.label ?? booking.pickup_time}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slateink/85">Vehicle</dt><dd className="font-semibold text-ink">{shortName(booking.vehicle_name)}</dd></div>
                  <div className="flex justify-between gap-3 border-t border-sage pt-1.5"><dt className="font-bold text-ink">{booking.trip_type === "round_trip" ? "Round Trip Fare" : "One-Way Fare"}</dt><dd className="font-mono text-lg font-bold text-ink" data-testid="booking-success-fare">{formatINR(booking.fare_total)}</dd></div>
                </dl>
                <a
                  href={whatsappLink(contact.whatsapp, bookingWhatsAppText(booking))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp py-3.5 font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
                  data-testid="whatsapp-share-btn"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" /> Send Booking on WhatsApp
                </a>
                <button type="button" onClick={restart} className="mt-3 text-sm font-semibold text-slateink/85 underline-offset-4 hover:text-ink hover:underline" data-testid="booking-new-btn">
                  Make another booking
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert" data-testid="wizard-error">
            {error}
          </p>
        )}

        {step < 3 && (
          <div className="mt-5 flex gap-2.5">
            {step > 0 && (
              <button
                type="button"
                onClick={() => { setError(""); setStep((s) => s - 1); }}
                className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-sage px-4 font-bold text-ink transition-colors hover:border-ink"
                data-testid="wizard-back-btn"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={next}
                disabled={fetchOptions.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-taxi py-3.5 font-extrabold uppercase tracking-wide text-black shadow-taxi transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                data-testid={step === 0 ? "get-fare-estimate-btn" : "wizard-vehicle-next-btn"}
              >
                {step === 0 ? (fetchOptions.isPending ? "Calculating…" : "Get Fare Estimate") : "Continue"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                form="wizard-details-form"
                disabled={submit.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-taxi py-3.5 font-extrabold uppercase tracking-wide text-black shadow-taxi transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                data-testid="booking-submit-btn"
              >
                {submit.isPending ? "Booking…" : "Confirm Booking"}
              </button>
            )}
          </div>
        )}
        {step === 0 && (
          <p className="mt-3 text-center text-xs text-slateink/85">
            Need help? <a href={contact.tel} className="font-bold text-ink hover:underline">Call us</a> ·{" "}
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:underline">WhatsApp</a>
          </p>
        )}
      </div>
    </div>
  );
}

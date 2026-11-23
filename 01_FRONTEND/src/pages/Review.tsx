import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Star } from "lucide-react";
import { ApiError, apiPost } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "@/components/site/sections";
import { IMAGES } from "@/lib/images";
import { usePageMeta } from "@/lib/seo";
import type { Review } from "@/lib/types";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function errorText(err: unknown): string {
  if (err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body) {
    const d = (err.body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d[0] && typeof d[0] === "object" && "msg" in d[0]) return String((d[0] as { msg: unknown }).msg).replace(/^Value error, /, "");
  }
  return "Could not submit your review. Please try again.";
}

export default function ReviewPage() {
  usePageMeta("Rate Your Trip", "Rate your Droptaxi Express trip with your booking ID.");
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ booking_id: params.get("id") ?? "", phone: "", rating: 0, comment: "" });
  const [hover, setHover] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Review | null>(null);

  const submit = useMutation({
    mutationFn: () => apiPost<Review>("/reviews", form),
    onSuccess: (review) => {
      setDone(review);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (err) => setError(errorText(err)),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.rating) return setError("Tap the stars to choose your rating.");
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError("Enter the 10-digit mobile number used for the booking.");
    setError("");
    submit.mutate();
  };

  const shown = hover || form.rating;

  return (
    <>
      <PageHero eyebrow="Reviews" title="Rate Your" highlight="Trip" text="Rode with Droptaxi Express? Tell other travellers how it went — it takes 20 seconds." image={IMAGES.scenicHighway} />
      <section className="py-14">
        <div className="mx-auto max-w-xl px-4">
          <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-sage">
            <div className="h-2 bg-taxi" aria-hidden="true" />
            <div className="p-6 sm:p-8">
              {done ? (
                <div className="py-6 text-center" data-testid="review-success-view">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-leaf" aria-hidden="true" />
                  <h2 className="mt-3 text-3xl font-bold text-ink">Thank you, {done.display_name}!</h2>
                  <p className="mt-2 text-slateink">Your {done.rating}-star review for {done.route} is now live on our home page.</p>
                  <Link to="/" className="mt-6 inline-flex rounded-xl bg-taxi px-6 py-3 font-extrabold text-black" data-testid="review-home-link">See it on the home page</Link>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5" data-testid="review-form">
                  <div>
                    <p className="text-sm font-bold text-ink">Your rating</p>
                    <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { setForm({ ...form, rating: n }); setError(""); }}
                          onMouseEnter={() => setHover(n)}
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          className="rounded-lg p-1 transition-transform duration-150 hover:scale-110"
                          data-testid={`review-star-${n}`}
                        >
                          <Star className={`h-10 w-10 ${n <= shown ? "fill-gold text-gold" : "text-sage"}`} aria-hidden="true" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-bold text-leaf" data-testid="review-rating-label">{LABELS[shown]}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="review-booking-id">Booking ID</Label>
                      <Input id="review-booking-id" required value={form.booking_id} onChange={(e) => setForm({ ...form, booking_id: e.target.value.toUpperCase() })} placeholder="DTX-12345" className="h-12 rounded-xl font-mono" data-testid="review-booking-id-input" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="review-phone">Mobile used for booking</Label>
                      <Input id="review-phone" required type="tel" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit mobile" className="h-12 rounded-xl" data-testid="review-phone-input" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="review-comment">Your review (optional)</Label>
                    <Textarea id="review-comment" rows={4} maxLength={500} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="How was the driver, the car and the ride?" className="rounded-xl" data-testid="review-comment-input" />
                  </div>
                  {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert" data-testid="review-error">{error}</p>}
                  <button type="submit" disabled={submit.isPending} className="w-full rounded-xl bg-taxi py-4 font-extrabold uppercase tracking-wide text-black shadow-taxi transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60" data-testid="review-submit-btn">
                    {submit.isPending ? "Submitting…" : "Submit Review"}
                  </button>
                  <p className="text-center text-xs text-slateink/85">Only completed trips can be reviewed. We show your first name and initial only.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

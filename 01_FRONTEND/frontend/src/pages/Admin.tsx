import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Lock, LogOut, MessageCircle, Phone, RefreshCw, Search, Star, Trash2 } from "lucide-react";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/site/Navbar";
import { shortName } from "@/lib/data";
import { adminWhatsAppText, formatINR, whatsappLink } from "@/lib/format";
import type { Booking, BookingStatus, Enquiry, Review } from "@/lib/types";

const KEY_STORAGE = "dtx_admin_key";

const STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-700",
  confirmed: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_FILTERS: Array<BookingStatus | "all"> = ["all", "new", "confirmed", "completed", "cancelled"];

function PasscodeGate({ onUnlock }: { onUnlock: (passcode: string) => void }) {
  const [passcode, setPasscode] = useState("");
  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-taxi to-sage px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="checker-tape h-2" aria-hidden="true" />
        <div className="space-y-5 p-7">
          <Logo />
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink">
              <Lock className="h-5 w-5 text-taxi-light" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-ink">Admin Console</h1>
            <p className="mt-1 text-sm text-slateink/85">Enter the dispatcher passcode to manage bookings &amp; enquiries.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-passcode">Passcode</Label>
            <Input
              id="admin-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onUnlock(passcode)}
              placeholder="Admin passcode"
              className="h-11 rounded-xl"
              data-testid="admin-passcode-input"
            />
          </div>
          <button
            type="button"
            onClick={() => onUnlock(passcode)}
            className="w-full rounded-xl bg-ink py-3 font-bold text-white transition-colors hover:bg-black"
            data-testid="admin-login-btn"
          >
            Unlock Console
          </button>
          <Link to="/" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slateink/85 hover:text-ink" data-testid="admin-back-home-link">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState<string>(() => sessionStorage.getItem(KEY_STORAGE) ?? "");
  const [view, setView] = useState<"bookings" | "enquiries" | "reviews">("bookings");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const headers = { "X-Admin-Key": adminKey };

  const unlock = (passcode: string) => {
    apiPost<{ ok: boolean }>("/admin/verify", { passcode })
      .then((result) => {
        if (result.ok) {
          sessionStorage.setItem(KEY_STORAGE, passcode);
          setAdminKey(passcode);
        } else {
          toast.error("Incorrect passcode");
        }
      })
      .catch(() => toast.error("Could not reach the server. Try again."));
  };

  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiGet<Booking[]>("/bookings", headers),
    enabled: adminKey !== "",
    retry: false,
  });

  const enquiriesQuery = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => apiGet<Enquiry[]>("/enquiries", headers),
    enabled: adminKey !== "",
    retry: false,
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", "all"],
    queryFn: () => apiGet<Review[]>("/reviews/all", headers),
    enabled: adminKey !== "",
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => apiPatch<Review>(`/reviews/${id}`, { published }, headers),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success(r.published ? "Review is visible on the website" : "Review hidden from the website");
    },
    onError: () => toast.error("Could not update review"),
  });

  const authFailed = bookingsQuery.error instanceof ApiError && bookingsQuery.error.status === 401;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => apiPatch<Booking>(`/bookings/${id}`, { status }, headers),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(`${updated.id} marked ${STATUS_LABELS[updated.status]}`);
    },
    onError: () => toast.error("Could not update booking status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean; id: string }>(`/bookings/${id}`, headers),
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(`Booking ${deleted.id} removed`);
    },
    onError: () => toast.error("Could not delete booking"),
  });

  const bookings = bookingsQuery.data ?? [];
  const enquiries = enquiriesQuery.data ?? [];
  const reviews = reviewsQuery.data ?? [];
  const reviewLink = (b: Booking) =>
    whatsappLink(
      `91${b.phone}`,
      `Hi ${b.customer_name}, thank you for riding with Droptaxi Express! Please rate your trip (${b.id}) here: ${window.location.origin}/review?id=${b.id}`,
    );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.id.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        shortName(b.pickup_city).toLowerCase().includes(q) ||
        shortName(b.drop_city).toLowerCase().includes(q)
      );
    });
  }, [bookings, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      new: bookings.filter((b) => b.status === "new").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      revenue: bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.fare_total, 0),
    }),
    [bookings],
  );

  const logout = () => {
    sessionStorage.removeItem(KEY_STORAGE);
    setAdminKey("");
    queryClient.removeQueries({ queryKey: ["bookings"] });
    queryClient.removeQueries({ queryKey: ["enquiries"] });
    queryClient.removeQueries({ queryKey: ["reviews", "all"] });
  };

  if (!adminKey || authFailed) {
    if (authFailed) sessionStorage.removeItem(KEY_STORAGE);
    return <PasscodeGate onUnlock={unlock} />;
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="bg-taxi">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" aria-label="Website home"><Logo /></Link>
            <div>
              <h1 className="font-sans text-lg font-extrabold text-black">Dispatch Console</h1>
              <p className="text-xs font-medium text-black/70">Bookings &amp; enquiries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-black/30 bg-white/60"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["bookings"] });
                queryClient.invalidateQueries({ queryKey: ["enquiries"] });
                queryClient.invalidateQueries({ queryKey: ["reviews"] });
              }}
              data-testid="admin-refresh-btn"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
            </Button>
            <Button size="sm" className="bg-black text-white hover:bg-ink" onClick={logout} data-testid="admin-logout-btn">
              <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Bookings", value: String(stats.total), testId: "admin-stat-total" },
            { label: "New (need call)", value: String(stats.new), testId: "admin-stat-new" },
            { label: "Confirmed", value: String(stats.confirmed), testId: "admin-stat-confirmed" },
            { label: "Completed Revenue", value: formatINR(stats.revenue), testId: "admin-stat-revenue" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border-l-4 border-taxi bg-white p-5 shadow-card ring-1 ring-sage">
              <dt className="text-xs font-bold uppercase tracking-wider text-slateink/85">{s.label}</dt>
              <dd className="mt-1.5 font-mono text-2xl font-bold text-ink" data-testid={s.testId}>{s.value}</dd>
            </div>
          ))}
        </dl>

        <Tabs value={view} onValueChange={(v: string) => setView(v as "bookings" | "enquiries" | "reviews")}>
          <TabsList data-testid="admin-view-tabs">
            <TabsTrigger value="bookings" data-testid="admin-view-bookings-tab">Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="enquiries" data-testid="admin-view-enquiries-tab">Enquiries ({enquiries.length})</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="admin-view-reviews-tab">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {view === "reviews" ? (
          <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-sage">
            {reviewsQuery.isPending ? (
              <p className="px-5 py-10 text-center text-sm text-slateink/85">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slateink/85" data-testid="admin-reviews-empty">
                No reviews yet. Use the star button on a completed booking to send the customer a review link.
              </p>
            ) : (
              <Table data-testid="admin-reviews-table">
                <TableHeader>
                  <TableRow className="bg-secondary">
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead className="text-right">On website</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r.id} className={r.published ? "" : "opacity-60"} data-testid={`admin-review-row-${r.booking_id}`}>
                      <TableCell className="font-mono text-xs font-bold text-leaf-deep">{r.booking_id}</TableCell>
                      <TableCell className="text-sm">
                        <span className="font-semibold text-ink">{r.display_name}</span>
                        <div className="text-xs text-slateink/85">{r.route}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold text-ink">{"★".repeat(r.rating)}<span className="text-sage">{"★".repeat(5 - r.rating)}</span></TableCell>
                      <TableCell className="max-w-md whitespace-normal text-sm text-slateink">{r.comment || <span className="italic text-slateink/60">No comment</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => publishMutation.mutate({ id: r.id, published: !r.published })}
                          data-testid={`admin-review-toggle-${r.booking_id}`}
                        >
                          {r.published ? <><Eye className="h-4 w-4" aria-hidden="true" /> Visible</> : <><EyeOff className="h-4 w-4" aria-hidden="true" /> Hidden</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : view === "bookings" ? (
          <>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <Tabs value={statusFilter} onValueChange={(v: string) => setStatusFilter(v as BookingStatus | "all")}>
                <TabsList data-testid="admin-status-tabs">
                  {STATUS_FILTERS.map((s) => (
                    <TabsTrigger key={s} value={s} data-testid={`admin-status-filter-${s}`}>
                      {s === "all" ? "All" : STATUS_LABELS[s]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="relative w-full lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slateink/60" aria-hidden="true" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, ID or city" className="bg-white pl-9" data-testid="admin-search-input" />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-sage">
              {bookingsQuery.isPending ? (
                <p className="px-5 py-10 text-center text-sm text-slateink/85">Loading bookings…</p>
              ) : filtered.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slateink/85" data-testid="admin-empty-state">
                  No bookings match this view yet. New customer bookings appear here instantly.
                </p>
              ) : (
                <Table data-testid="admin-bookings-table">
                  <TableHeader>
                    <TableRow className="bg-secondary">
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Fare</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow key={b.id} data-testid={`admin-row-${b.id}`}>
                        <TableCell className="font-mono text-xs font-bold text-taxi-deep">{b.id}</TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-ink">{b.customer_name}</div>
                          <a href={`tel:+91${b.phone}`} className="text-xs text-slateink/85 hover:text-ink">{b.phone}</a>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-ink">{shortName(b.pickup_city)} → {shortName(b.drop_city)}</div>
                          {b.trip_type === "round_trip" && (
                            <div className="text-[11px] font-bold text-leaf" data-testid={`admin-roundtrip-${b.id}`}>Round trip · return {b.return_date} · {b.days}d</div>
                          )}
                          <div className="max-w-44 truncate text-xs text-slateink/85" title={`${b.pickup_address} → ${b.drop_address}`}>{b.pickup_address} → {b.drop_address}</div>
                          {(b.road_km > 0 || b.whatsapp_status) && (
                            <div className="text-[11px] text-slateink/80" data-testid={`admin-trip-meta-${b.id}`}>
                              {b.road_km > 0 ? `${b.road_km} km · ${b.duration}` : ""}
                              {b.whatsapp_status ? ` · WhatsApp receipt: ${b.whatsapp_status.replace("_", " ")}` : ""}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {b.pickup_date}
                          <div className="text-xs text-slateink/85">{b.pickup_time}</div>
                        </TableCell>
                        <TableCell className="max-w-36 truncate text-sm">{shortName(b.vehicle_name)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-ink">
                          {formatINR(b.fare_total)}
                          {!b.fare_fixed && <div className="text-[10px] font-medium text-slateink/60">estimated</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_BADGE[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <Select value={b.status} onValueChange={(v: string) => statusMutation.mutate({ id: b.id, status: v as BookingStatus })}>
                              <SelectTrigger size="sm" className="w-28 text-xs" aria-label={`Update status for ${b.id}`} data-testid={`admin-status-select-${b.id}`}>
                                <SelectValue>{(v: string | null) => (v ? STATUS_LABELS[v as BookingStatus] : "")}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_FILTERS.filter((s) => s !== "all").map((s) => (
                                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <a
                              href={whatsappLink(`91${b.phone}`, adminWhatsAppText(b))}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`WhatsApp ${b.customer_name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                              data-testid={`admin-whatsapp-${b.id}`}
                            >
                              <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            </a>
                            {b.status === "completed" && (
                              <a
                                href={reviewLink(b)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Send review link to ${b.customer_name}`}
                                title="Send review link on WhatsApp"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50"
                                data-testid={`admin-review-link-${b.id}`}
                              >
                                <Star className="h-4 w-4" aria-hidden="true" />
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => window.confirm(`Delete booking ${b.id}?`) && deleteMutation.mutate(b.id)}
                              aria-label={`Delete booking ${b.id}`}
                              data-testid={`admin-delete-${b.id}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-sage">
            {enquiriesQuery.isPending ? (
              <p className="px-5 py-10 text-center text-sm text-slateink/85">Loading enquiries…</p>
            ) : enquiries.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slateink/85" data-testid="admin-enquiries-empty">
                No enquiries yet. Messages from the Contact page appear here.
              </p>
            ) : (
              <Table data-testid="admin-enquiries-table">
                <TableHeader>
                  <TableRow className="bg-secondary">
                    <TableHead>Received</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Reply</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.map((e) => (
                    <TableRow key={e.id} data-testid={`admin-enquiry-row-${e.id}`}>
                      <TableCell className="whitespace-nowrap text-xs text-slateink/85">
                        {new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-ink">{e.name}</TableCell>
                      <TableCell className="text-sm">
                        {e.phone}
                        {e.email && <div className="text-xs text-slateink/85">{e.email}</div>}
                      </TableCell>
                      <TableCell className="max-w-md whitespace-normal text-sm text-slateink">{e.message}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <a href={`tel:+91${e.phone}`} aria-label={`Call ${e.name}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink hover:bg-secondary" data-testid={`admin-enquiry-call-${e.id}`}>
                            <Phone className="h-4 w-4" aria-hidden="true" />
                          </a>
                          <a href={whatsappLink(`91${e.phone}`, `Hi ${e.name}, thanks for contacting Droptaxi Express.`)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${e.name}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50" data-testid={`admin-enquiry-whatsapp-${e.id}`}>
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

import type { Booking } from "@/lib/types";

// ₹5,300 / ₹14/km — Indian Rupee grouping, no decimals.
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function bookingWhatsAppText(booking: Booking): string {
  return [
    booking.trip_type === "round_trip" ? "New Round Trip Taxi Booking" : "New One Way Drop Taxi Booking",
    `Booking ID: ${booking.id}`,
    `Name: ${booking.customer_name}`,
    `Phone: ${booking.phone}`,
    `Pickup: ${booking.pickup_city} - ${booking.pickup_address}`,
    `Drop: ${booking.drop_city} - ${booking.drop_address}`,
    `Date & Time: ${booking.pickup_date} at ${booking.pickup_time}`,
    ...(booking.trip_type === "round_trip" ? [`Return Date: ${booking.return_date} (${booking.days} day${booking.days > 1 ? "s" : ""})`] : []),
    `Vehicle: ${booking.vehicle_name}`,
    booking.trip_type === "round_trip"
      ? `Round Trip Fare: Rs.${booking.fare_total} (${booking.distance_km} km)`
      : `One-Way Fare: Rs.${booking.fare_total} (pay only for the drop)`,
  ].join("\n");
}

export function adminWhatsAppText(booking: Booking): string {
  return [
    `Drop Taxi Booking ${booking.id}`,
    `Customer: ${booking.customer_name} (${booking.phone})`,
    `Trip: ${booking.pickup_city} to ${booking.drop_city} (${booking.trip_type === "round_trip" ? `round trip, return ${booking.return_date}` : "one way"})`,
    `Pickup: ${booking.pickup_date} at ${booking.pickup_time}`,
    `Vehicle: ${booking.vehicle_name}`,
    `Fare: Rs.${booking.fare_total}`,
    `Status: ${booking.status}`,
  ].join("\n");
}

// Stock photography used across the marketing pages (Unsplash / Pexels CDN).
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=75`;
const p = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1400`;

export const IMAGES = {
  heroHighway: p("19223147"),
  scenicHighway: u("photo-1551952237-954a0e68786c"),
  airport: u("photo-1617263526926-f2d40cef7ee1"),
  temple: p("34148386"),
  templeNight: u("photo-1582510003544-4d00b7f74220"),
  chennai: p("8572308"),
  bangalore: p("14845309"),
  innovaStreet: u("photo-1748215210939-ad8b6c8c086d"),
};

export const VEHICLE_IMAGES: Record<string, string> = {
  sedan: p("14776716"),
  etios: u("photo-1714502524998-e8ea4dd3781d"),
  suv: p("27497571"),
  innova: u("photo-1748215210939-ad8b6c8c086d"),
  innova_crysta: u("photo-1748215210950-536c6621629a"),
};

const CITY_IMAGES: Record<string, string> = {
  Chennai: IMAGES.chennai,
  Bangalore: IMAGES.bangalore,
  Madurai: IMAGES.templeNight,
  "Trichy (Tiruchirappalli)": IMAGES.temple,
  Coimbatore: IMAGES.scenicHighway,
  "Pondicherry (Puducherry)": u("photo-1724992609079-75164f1ba2dd"),
  Salem: IMAGES.heroHighway,
};

export function cityImage(city: string): string {
  return CITY_IMAGES[city] ?? IMAGES.scenicHighway;
}

/**
 * Stays we put people in. Same reasoning as destinations.ts: a plain typed
 * array so the public pages stay Server Components and the swap to MongoDB
 * later is a one-file change.
 */

export type Hotel = {
  id: string;
  name: string;
  location: string;
  /** Which destination id this stay belongs to, for cross-linking. */
  destinationId: string;
  blurb: string;
  /** Price per room per night in PKR. */
  pricePerNight: number;
  rating: number;
  stars: 3 | 4 | 5;
  amenities: string[];
  image: string;
};

export const hotels: Hotel[] = [
  {
    id: "serena-hunza",
    name: "Karimabad Serena Inn",
    location: "Karimabad, Hunza",
    destinationId: "hunza",
    blurb:
      "Terraced garden rooms looking straight across at Rakaposhi. Breakfast on the lawn when the weather allows, which in season is most mornings.",
    pricePerNight: 24000,
    rating: 4.8,
    stars: 4,
    amenities: ["Mountain view", "Restaurant", "Wi-Fi", "Room heating", "Parking"],
    image:
      "https://media.istockphoto.com/id/636484522/photo/hotel-resort-swimming-pool.jpg?s=612x612&w=0&k=20&c=ET-8reopQEIhH4YYee6tqlFpfKEg19oLRRCJX3-56rs=",
  },
  {
    id: "shangrila-skardu",
    name: "Shangrila Resort",
    location: "Lower Kachura, Skardu",
    destinationId: "skardu",
    blurb:
      "The one with the aeroplane restaurant, on the shore of Lower Kachura lake. Worth a night for the setting alone.",
    pricePerNight: 32000,
    rating: 4.7,
    stars: 4,
    amenities: ["Lakefront", "Restaurant", "Boating", "Gardens", "Parking"],
    image:
      "https://media.istockphoto.com/id/636948050/photo/luxury-construction-hotel-swimming-pool.jpg?s=612x612&w=0&k=20&c=dgmIyvr_E4yluDrcvZtWgkr_gq_ZS--rodGKYJr53C4=",
  },
  {
    id: "fairy-cabins",
    name: "Raikot Sarai Cabins",
    location: "Fairy Meadows",
    destinationId: "fairy-meadows",
    blurb:
      "Wooden cabins on the meadow itself. Basic by design — no road, no mains power after ten — with Nanga Parbat directly out of the front door.",
    pricePerNight: 15000,
    rating: 4.5,
    stars: 3,
    amenities: ["Nanga Parbat view", "Wood stove", "Half board", "Guided walks"],
    image:
      "https://media.istockphoto.com/id/162137765/photo/summer-swimming-pool.jpg?s=612x612&w=0&k=20&c=Wv3DeS8S-yygZpJ6eE90iu7861DRVd177MlGTZVWd1I=",
  },
  {
    id: "sharda-riverside",
    name: "Sharda Riverside Lodge",
    location: "Sharda, Neelum Valley",
    destinationId: "neelum",
    blurb:
      "Rooms with the Neelum running past the balcony. You will hear the river all night, which is either the selling point or the drawback depending on the guest.",
    pricePerNight: 14000,
    rating: 4.4,
    stars: 3,
    amenities: ["Riverside", "Restaurant", "Bonfire", "Parking"],
    image:
      "https://media.istockphoto.com/id/1355094373/photo/luxury-beach-sea-view-pool-villa-3d-rendering.jpg?s=612x612&w=0&k=20&c=pMnXRZzCdJ05A3DTKlUIHRJUwGVtrIEivPMVk-MD4-k=",
  },
  {
    id: "lahore-heritage",
    name: "Walled City Heritage Haveli",
    location: "Delhi Gate, Lahore",
    destinationId: "lahore",
    blurb:
      "A restored haveli inside the Walled City with a rooftop that faces the Wazir Khan Mosque. Ten minutes on foot from Food Street.",
    pricePerNight: 28000,
    rating: 4.9,
    stars: 5,
    amenities: ["Rooftop terrace", "Heritage building", "Wi-Fi", "Air conditioning", "Airport transfer"],
    image:
      "https://media.gettyimages.com/id/1489994533/photo/sunlight-reflected-in-swimming-pool-puglia-italy.jpg?s=612x612&w=0&k=20&c=F2bDXBI3HT40b3xObXeOAz6Ah3IlVld3Y_M-aVdJ9Zg=",
  },
  {
    id: "kund-malir-camp",
    name: "Kund Malir Beach Camp",
    location: "Kund Malir, Makran Coast",
    destinationId: "makran",
    blurb:
      "Our own tented camp above the beach in Hingol. Proper beds, shared washblocks, and no other lights for thirty kilometres in either direction.",
    pricePerNight: 12000,
    rating: 4.3,
    stars: 3,
    amenities: ["Beachfront", "Full board", "Bonfire", "Stargazing", "4x4 access"],
    image:
      "https://media.istockphoto.com/id/1355094373/photo/luxury-beach-sea-view-pool-villa-3d-rendering.jpg?s=612x612&w=0&k=20&c=pMnXRZzCdJ05A3DTKlUIHRJUwGVtrIEivPMVk-MD4-k=",
  },
];

export function getHotel(id: string): Hotel | undefined {
  return hotels.find((h) => h.id === id);
}

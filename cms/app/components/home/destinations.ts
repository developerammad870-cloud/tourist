/**
 * Featured destinations — all within Pakistan.
 *
 * This is the single source of truth for trips: the home page, /destinations,
 * the /destinations/[slug] detail pages, the booking form and the booking API
 * all read from here, so a price or a name can only be changed in one place.
 *
 * Deliberately a plain typed array rather than a database read. The public
 * pages are Server Components, so swapping this for MongoDB later is a
 * contained change — replace `destinations` with an awaited `getDb()` query
 * returning the same shape and nothing in the components has to move.
 */

/** Chooses which layered SVG scene is drawn behind a card. */
export type Terrain = "alpine" | "tropical" | "desert" | "city" | "coast";

export type ItineraryDay = {
  day: number;
  title: string;
  detail: string;
};

export type Destination = {
  id: string;
  name: string;
  region: string;
  tagline: string;
  terrain: Terrain;
  nights: number;
  /** Price per person in PKR. */
  priceFrom: number;
  rating: number;
  /** Sky-to-ground ramp for the card's scene, far → near. */
  palette: [string, string, string, string];

  /* ---- detail-page fields ---- */

  /** Two or three sentences shown at the top of the detail page. */
  summary: string;
  /** Short bullets, rendered as a chip row. */
  highlights: string[];
  itinerary: ItineraryDay[];
  included: string[];
  notIncluded: string[];
  /** Human-readable travel window, e.g. "May – October". */
  bestMonths: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  /** Remote hotlinks — see the note in app/content/gallery.ts. */
  images: string[];
};

export const destinations: Destination[] = [
  {
    id: "hunza",
    name: "Hunza Valley",
    region: "Gilgit-Baltistan",
    tagline:
      "Apricot orchards under Rakaposhi, and the old Baltit Fort watching over Karimabad.",
    terrain: "alpine",
    nights: 6,
    priceFrom: 85000,
    rating: 4.9,
    palette: ["#1e3a5f", "#3f6f9c", "#7fb2d9", "#cfe6f5"],
    summary:
      "Hunza is the valley most people picture when they think of northern Pakistan: terraced orchards stacked above the river, Rakaposhi filling the window at breakfast, and forts that have watched the Silk Road for six hundred years. We run it at an unhurried pace, with two nights in Karimabad so you get both a sunrise and a sunset over the Ultar glacier.",
    highlights: [
      "Baltit & Altit forts",
      "Attabad Lake",
      "Passu Cones",
      "Eagle's Nest sunrise",
      "Khunjerab Pass",
    ],
    itinerary: [
      {
        day: 1,
        title: "Islamabad → Chilas",
        detail:
          "Early start up the Karakoram Highway, following the Indus through the Kohistan gorge. Overnight in Chilas.",
      },
      {
        day: 2,
        title: "Chilas → Karimabad",
        detail:
          "The best driving day of the trip: Nanga Parbat viewpoint, the Gilgit river confluence, then up into Hunza for late lunch.",
      },
      {
        day: 3,
        title: "Karimabad",
        detail:
          "Baltit Fort in the morning, Altit and the old settlement after lunch, Eagle's Nest for sunset over Rakaposhi.",
      },
      {
        day: 4,
        title: "Upper Hunza",
        detail:
          "Attabad Lake by boat, the Hussaini suspension bridge, and the Passu Cones from the Borith side.",
      },
      {
        day: 5,
        title: "Khunjerab Pass",
        detail:
          "Up to the Chinese border at 4,693 m and back — the highest paved border crossing in the world. Long day, thin air.",
      },
      {
        day: 6,
        title: "Karimabad → Gilgit",
        detail: "A slow morning in the bazaar, then down to Gilgit for the night.",
      },
      {
        day: 7,
        title: "Fly or drive back",
        detail:
          "Gilgit–Islamabad flight if the weather holds, otherwise the road back down.",
      },
    ],
    included: [
      "6 nights' accommodation, twin share",
      "Private 4x4 and driver throughout",
      "Daily breakfast and dinner",
      "English/Urdu speaking guide",
      "All fort and park entry fees",
      "Khunjerab National Park permit",
    ],
    notIncluded: [
      "Domestic flights",
      "Lunches and drinks",
      "Travel insurance",
      "Tips and personal expenses",
    ],
    bestMonths: "April – October",
    difficulty: "Easy",
    images: [
      "https://media.istockphoto.com/id/545564864/photo/autumn-in-hunza-valley.jpg?s=612x612&w=0&k=20&c=PVIrofhR0K7kh1Mb4hGP47ZI33krSHrUcjNrf1eoXM0=",
      "https://media.istockphoto.com/id/1198242090/photo/passu-cones-in-northern-pakistan-taken-in-august-2019.jpg?s=612x612&w=0&k=20&c=Z0HGKpqolxJ9rgzrYPBm222R7GF1HDBBiKoMVP856zQ=",
      "https://media.istockphoto.com/id/2183921802/photo/aerial-drone-view-of-attabad-lake-in-a-beautiful-autumn-season-at-passu-karakoram-mountains.jpg?s=612x612&w=0&k=20&c=S9ot81ESU6h2fioYpPJg0mqyrbm6_YwVrsUf4jqJDms=",
    ],
  },
  {
    id: "skardu",
    name: "Skardu",
    region: "Gilgit-Baltistan",
    tagline:
      "Cold desert dunes meeting the Indus, with Shangrila and Upper Kachura close by.",
    terrain: "desert",
    nights: 7,
    priceFrom: 120000,
    rating: 4.9,
    palette: ["#5c4a3a", "#a98a5f", "#d9bd8a", "#f2e3c4"],
    summary:
      "Skardu is the staging post for four of the world's fourteen eight-thousanders, but you don't need to be a climber to feel it. This is a wide, high, strange valley — cold sand dunes running straight into a river the colour of milk, lakes held in bowls of rock, and light that goes gold for about an hour before it goes dark.",
    highlights: [
      "Shangrila & Upper Kachura",
      "Katpana cold desert",
      "Shigar Fort",
      "Deosai Plains",
      "Manthoka waterfall",
    ],
    itinerary: [
      {
        day: 1,
        title: "Islamabad → Chilas",
        detail: "Karakoram Highway all day, overnight in Chilas.",
      },
      {
        day: 2,
        title: "Chilas → Skardu",
        detail: "Turn east at Jaglot and follow the Indus in on the Skardu road.",
      },
      {
        day: 3,
        title: "Lakes day",
        detail:
          "Shangrila (Lower Kachura) in the morning, Upper Kachura after lunch, Katpana dunes at sunset.",
      },
      {
        day: 4,
        title: "Shigar valley",
        detail:
          "Shigar Fort, the old wooden mosque, and the road towards Askole as far as the surface allows.",
      },
      {
        day: 5,
        title: "Deosai Plains",
        detail:
          "Up onto the second-highest plateau on earth — Sheosar Lake, marmots, and possibly brown bear at distance.",
      },
      {
        day: 6,
        title: "Khaplu",
        detail:
          "East to Khaplu Palace and the Shyok valley, back to Skardu for the night.",
      },
      {
        day: 7,
        title: "Manthoka & bazaar",
        detail: "Manthoka waterfall in the morning, then a free afternoon in Skardu.",
      },
      {
        day: 8,
        title: "Return",
        detail: "Fly Skardu–Islamabad, or drive back down the KKH.",
      },
    ],
    included: [
      "7 nights' accommodation, twin share",
      "Private 4x4 and driver throughout",
      "Daily breakfast and dinner",
      "English/Urdu speaking guide",
      "Deosai National Park permit",
      "All fort and site entry fees",
    ],
    notIncluded: [
      "Domestic flights",
      "Lunches and drinks",
      "Travel insurance",
      "Tips and personal expenses",
    ],
    bestMonths: "May – September",
    difficulty: "Moderate",
    images: [
      "https://media.istockphoto.com/id/1964717416/photo/shangrila-lower-kachura-lake-skardu-gilgit-baltistan-pakistan.jpg?s=612x612&w=0&k=20&c=0a0AVYm8R_tgkoxKFG-_h458dWou9jX6-EI6UyiairM=",
      "https://media.istockphoto.com/id/1352993622/photo/autumn-landscape-photography.jpg?s=612x612&w=0&k=20&c=2axy-zz7T0Sl9MrVpL31gMQPy-pxs6SXpezCJw8ineA=",
      "https://media.istockphoto.com/id/2163825305/photo/waterfall.jpg?s=612x612&w=0&k=20&c=Nf64F5CbW9MTyvosb2r5hS5mHMeaS-NkSCg0Ru4CHew=",
    ],
  },
  {
    id: "fairy-meadows",
    name: "Fairy Meadows",
    region: "Nanga Parbat, GB",
    tagline:
      "Green shelf under the Killer Mountain — jeep track in, then the last stretch on foot.",
    terrain: "alpine",
    nights: 5,
    priceFrom: 95000,
    rating: 4.8,
    palette: ["#22384f", "#4a7a6a", "#8fc0a0", "#e6f2e4"],
    summary:
      "A meadow at 3,300 m with the ninth-highest mountain on earth standing directly in front of it. Getting there is part of the trip: a jeep track that has a reputation, then an hour or so walking in through pine forest. The reward is a north face that turns pink at about five in the morning and stays with you afterwards.",
    highlights: [
      "Nanga Parbat north face",
      "Beyal Camp walk",
      "Raikot glacier viewpoint",
      "Night skies with no light pollution",
    ],
    itinerary: [
      {
        day: 1,
        title: "Islamabad → Chilas",
        detail: "Down the KKH, overnight at Chilas.",
      },
      {
        day: 2,
        title: "Raikot Bridge → Fairy Meadows",
        detail:
          "Jeep up the Raikot track, then walk the last 3 km into the meadows. Cabins for two nights.",
      },
      {
        day: 3,
        title: "Beyal Camp",
        detail:
          "Walk out towards Beyal and the glacier viewpoint for the full base-camp perspective. Back for sunset.",
      },
      {
        day: 4,
        title: "Down to Gilgit",
        detail:
          "Walk out, jeep down, and north to Gilgit for a proper bed and a hot shower.",
      },
      {
        day: 5,
        title: "Gilgit & Naltar",
        detail: "Day trip up to the Naltar lakes, back to Gilgit.",
      },
      {
        day: 6,
        title: "Return",
        detail: "Fly or drive back to Islamabad.",
      },
    ],
    included: [
      "5 nights' accommodation (2 in mountain cabins)",
      "Jeep transfer on the Raikot track",
      "Porter for the walk in and out",
      "Daily breakfast and dinner",
      "English/Urdu speaking guide",
      "Nanga Parbat park fees",
    ],
    notIncluded: [
      "Domestic flights",
      "Lunches and drinks",
      "Travel insurance",
      "Tips and personal expenses",
    ],
    bestMonths: "May – September",
    difficulty: "Moderate",
    images: [
      "https://media.istockphoto.com/id/1462681959/photo/fairy-meadows-road.jpg?s=612x612&w=0&k=20&c=ttsengg0I3Zn_ZbEDKmyRcRWHbyJkV61gzlZhrTy8v8=",
      "https://media.istockphoto.com/id/528162867/photo/nanga-parbat-peak.jpg?s=612x612&w=0&k=20&c=y0LL4OObdyWeBV_G_D1BokSajxwnA6uqUyqBaQnERsc=",
      "https://media.istockphoto.com/id/2171450049/photo/nanga-parbat-from-fairy-meadows-in-morning-light.jpg?s=612x612&w=0&k=20&c=L2uQbAAMBz_mnC9-3mOmHeBBvLh_Rjc95zg34ELw5v8=",
    ],
  },
  {
    id: "neelum",
    name: "Neelum Valley",
    region: "Azad Kashmir",
    tagline:
      "River the colour of glass, pine slopes on both banks, and Ratti Gali above the treeline.",
    terrain: "tropical",
    nights: 5,
    priceFrom: 65000,
    rating: 4.7,
    palette: ["#0f3b36", "#1f6b5c", "#4fa88a", "#bfe3c9"],
    summary:
      "Neelum is the green one. A single road follows the river for 200 km with pine forest climbing away on both sides, and every twenty minutes there is a reason to stop. It is the most accessible of our northern trips — no altitude to speak of until the Ratti Gali day — and the best value on the list.",
    highlights: [
      "Ratti Gali alpine lake",
      "Kutton / Jagran valley",
      "Sharda ruins",
      "Arang Kel",
      "Kel riverside",
    ],
    itinerary: [
      {
        day: 1,
        title: "Islamabad → Kutton",
        detail:
          "Via Muzaffarabad and into the Neelum valley. Riverside stay at Kutton.",
      },
      {
        day: 2,
        title: "Kutton → Sharda",
        detail:
          "Up the valley with stops at Kundal Shahi and Dhani. Sharda for two nights.",
      },
      {
        day: 3,
        title: "Ratti Gali",
        detail:
          "Jeep to the base then a walk up to the lake at 3,700 m. The long day of the trip, and the best one.",
      },
      {
        day: 4,
        title: "Sharda → Kel → Arang Kel",
        detail: "On to Kel, then the chairlift and climb up to Arang Kel village.",
      },
      {
        day: 5,
        title: "Down the valley",
        detail: "Back towards Muzaffarabad with a stop at Keran.",
      },
      {
        day: 6,
        title: "Return to Islamabad",
        detail: "Morning drive back.",
      },
    ],
    included: [
      "5 nights' accommodation, twin share",
      "Private vehicle and driver throughout",
      "Jeep hire for the Ratti Gali day",
      "Daily breakfast and dinner",
      "English/Urdu speaking guide",
    ],
    notIncluded: [
      "Lunches and drinks",
      "Arang Kel chairlift ticket",
      "Travel insurance",
      "Tips and personal expenses",
    ],
    bestMonths: "May – October",
    difficulty: "Easy",
    images: [
      "https://media.istockphoto.com/id/2163825305/photo/waterfall.jpg?s=612x612&w=0&k=20&c=Nf64F5CbW9MTyvosb2r5hS5mHMeaS-NkSCg0Ru4CHew=",
      "https://media.istockphoto.com/id/1352993622/photo/autumn-landscape-photography.jpg?s=612x612&w=0&k=20&c=2axy-zz7T0Sl9MrVpL31gMQPy-pxs6SXpezCJw8ineA=",
    ],
  },
  {
    id: "lahore",
    name: "Lahore",
    region: "Punjab",
    tagline:
      "Badshahi Mosque at dusk, the Walled City after dark, and food that runs past midnight.",
    terrain: "city",
    nights: 3,
    priceFrom: 45000,
    rating: 4.8,
    palette: ["#2a1b2f", "#5c3350", "#a85b6b", "#f0c9a8"],
    summary:
      "Three nights in the city that everyone tells you about. Mughal architecture in the morning, the Walled City on foot in the late afternoon, and dinner somewhere that has been doing one dish well for eighty years. Short, urban, and the easiest trip on this list to add to the front or back of a northern route.",
    highlights: [
      "Badshahi Mosque",
      "Lahore Fort & Sheesh Mahal",
      "Walled City food walk",
      "Wagah border ceremony",
      "Shalimar Gardens",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrive Lahore",
        detail:
          "Settle in, then an evening walk to Badshahi Mosque and the Food Street for dinner.",
      },
      {
        day: 2,
        title: "Mughal Lahore",
        detail:
          "Lahore Fort, Sheesh Mahal and Shalimar Gardens, then the Wagah border ceremony at sunset.",
      },
      {
        day: 3,
        title: "Walled City",
        detail:
          "Delhi Gate to the Wazir Khan Mosque on foot, with the haveli rooftops and a long lunch.",
      },
      {
        day: 4,
        title: "Departure",
        detail: "Free morning, then transfer out.",
      },
    ],
    included: [
      "3 nights' accommodation, twin share",
      "Private car and driver in the city",
      "Daily breakfast",
      "Guided Walled City food walk",
      "All monument entry fees",
    ],
    notIncluded: [
      "Flights",
      "Most lunches and dinners",
      "Travel insurance",
      "Tips and personal expenses",
    ],
    bestMonths: "October – March",
    difficulty: "Easy",
    images: [
      "https://media.istockphoto.com/id/545564864/photo/autumn-in-hunza-valley.jpg?s=612x612&w=0&k=20&c=PVIrofhR0K7kh1Mb4hGP47ZI33krSHrUcjNrf1eoXM0=",
    ],
  },
  {
    id: "makran",
    name: "Makran Coast",
    region: "Balochistan",
    tagline:
      "Hingol's badlands, the Princess of Hope, and empty Arabian Sea beaches the whole way.",
    terrain: "coast",
    nights: 4,
    priceFrom: 110000,
    rating: 4.6,
    palette: ["#243a55", "#4d7fa8", "#d99a63", "#f5dcb4"],
    summary:
      "The coastal road west of Karachi runs for hundreds of kilometres past mud volcanoes, wind-carved rock and beaches with nobody on them. Hingol National Park is the centrepiece — it looks like nowhere else in the country. This is the wildest trip we run and the one with the least infrastructure, which is precisely the point.",
    highlights: [
      "Hingol National Park",
      "Princess of Hope",
      "Chandragup mud volcano",
      "Kund Malir beach",
      "Ormara headland",
    ],
    itinerary: [
      {
        day: 1,
        title: "Karachi → Kund Malir",
        detail:
          "West on the Makran Coastal Highway, first stop at the Buzi Pass viewpoint. Beach camp for the night.",
      },
      {
        day: 2,
        title: "Hingol National Park",
        detail:
          "The Princess of Hope, the Sphinx, and up to the Chandragup mud volcanoes.",
      },
      {
        day: 3,
        title: "Kund Malir → Ormara",
        detail: "Further west along the coast to the Ormara headland and its beaches.",
      },
      {
        day: 4,
        title: "Ormara → Karachi",
        detail: "The long drive back with stops wherever the coast asks for it.",
      },
    ],
    included: [
      "4 nights (2 hotel, 2 beach camp)",
      "Private 4x4 and driver throughout",
      "All meals while camping",
      "Camping equipment",
      "Hingol National Park fees",
      "English/Urdu speaking guide",
    ],
    notIncluded: [
      "Flights to Karachi",
      "Meals in Karachi",
      "Travel insurance",
      "Tips and personal expenses",
    ],
    bestMonths: "November – February",
    difficulty: "Challenging",
    images: [
      "https://ychef.files.bbci.co.uk/1280x720/p0lkwzv4.jpg",
      "https://c4.wallpaperflare.com/wallpaper/660/812/963/water-lake-karakoram-mountains-pakistan-wallpaper-thumb.jpg",
    ],
  },
];

/** Look one trip up by its slug/id. Returns undefined when nothing matches. */
export function getDestination(id: string): Destination | undefined {
  return destinations.find((d) => d.id === id);
}

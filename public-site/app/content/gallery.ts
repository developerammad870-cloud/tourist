/**
 * Photo gallery, grouped by place.
 *
 * Every image here is a REMOTE HOTLINK to istock/bbc/wallpaperflare, carried
 * over from the original /places page. They are plain <img> tags rather than
 * next/image on purpose: next/image would need a `remotePatterns` entry in
 * next.config.ts for each host. Worth knowing they can disappear without
 * warning — anything you want permanently should be downloaded into /public
 * and referenced as a local path instead.
 */

export type GalleryGroup = {
  name: string;
  region: string;
  /** Optional link to the matching trip, so the gallery feeds the funnel. */
  destinationId?: string;
  shots: string[];
};

export const galleryGroups: GalleryGroup[] = [
  {
    name: "Hunza Valley",
    region: "Gilgit-Baltistan",
    destinationId: "hunza",
    shots: [
      "https://media.istockphoto.com/id/1198242090/photo/passu-cones-in-northern-pakistan-taken-in-august-2019.jpg?s=612x612&w=0&k=20&c=Z0HGKpqolxJ9rgzrYPBm222R7GF1HDBBiKoMVP856zQ=",
      "https://media.istockphoto.com/id/545564864/photo/autumn-in-hunza-valley.jpg?s=612x612&w=0&k=20&c=PVIrofhR0K7kh1Mb4hGP47ZI33krSHrUcjNrf1eoXM0=",
      "https://media.istockphoto.com/id/2183921802/photo/aerial-drone-view-of-attabad-lake-in-a-beautiful-autumn-season-at-passu-karakoram-mountains.jpg?s=612x612&w=0&k=20&c=S9ot81ESU6h2fioYpPJg0mqyrbm6_YwVrsUf4jqJDms=",
      "https://i.pinimg.com/736x/c5/5b/26/c55b26d78bcb54ba1d5959e62c614f5e.jpg",
    ],
  },
  {
    name: "Skardu",
    region: "Gilgit-Baltistan",
    destinationId: "skardu",
    shots: [
      "https://media.istockphoto.com/id/2221289015/photo/beautiful-view-of-nanga-parbat-from-fairy-meadows-towards-nanga-parbat-base-camp-in-the.jpg?s=612x612&w=0&k=20&c=HW1YUD5qmgymMDF9eFuPYf5rQJn0aWURm3AJfxOYoO4=",
      "https://media.istockphoto.com/id/1352993622/photo/autumn-landscape-photography.jpg?s=612x612&w=0&k=20&c=2axy-zz7T0Sl9MrVpL31gMQPy-pxs6SXpezCJw8ineA=",
      "https://media.istockphoto.com/id/2163825305/photo/waterfall.jpg?s=612x612&w=0&k=20&c=Nf64F5CbW9MTyvosb2r5hS5mHMeaS-NkSCg0Ru4CHew=",
      "https://media.istockphoto.com/id/1964717416/photo/shangrila-lower-kachura-lake-skardu-gilgit-baltistan-pakistan.jpg?s=612x612&w=0&k=20&c=0a0AVYm8R_tgkoxKFG-_h458dWou9jX6-EI6UyiairM=",
    ],
  },
  {
    name: "Fairy Meadows",
    region: "Nanga Parbat, Gilgit-Baltistan",
    destinationId: "fairy-meadows",
    shots: [
      "https://media.istockphoto.com/id/1462681959/photo/fairy-meadows-road.jpg?s=612x612&w=0&k=20&c=ttsengg0I3Zn_ZbEDKmyRcRWHbyJkV61gzlZhrTy8v8=",
      "https://media.istockphoto.com/id/528162867/photo/nanga-parbat-peak.jpg?s=612x612&w=0&k=20&c=y0LL4OObdyWeBV_G_D1BokSajxwnA6uqUyqBaQnERsc=",
      "https://media.istockphoto.com/id/2171450049/photo/nanga-parbat-from-fairy-meadows-in-morning-light.jpg?s=612x612&w=0&k=20&c=L2uQbAAMBz_mnC9-3mOmHeBBvLh_Rjc95zg34ELw5v8=",
      "https://media.istockphoto.com/id/953699682/photo/hdr-photography-of-sunset-light-on-nanga-parbat-mountain-with-water-reflection-gilgit.jpg?s=612x612&w=0&k=20&c=lynKsdhyQmgiu7zjxBPr7oodTs5mTz6BaEQYx57GW9E=",
    ],
  },
  {
    name: "Attabad Lake",
    region: "Hunza, Gilgit-Baltistan",
    destinationId: "hunza",
    shots: [
      "https://ychef.files.bbci.co.uk/1280x720/p0lkwzv4.jpg",
      "https://c4.wallpaperflare.com/wallpaper/660/812/963/water-lake-karakoram-mountains-pakistan-wallpaper-thumb.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ1OQZ3ZSvVWaOWcWDuO2fQBMkVXj3qiqzKWUJmz535g&s=10",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU_qjtpsCuTZ1dfqXYSaiqc2eWbZJZN79hnAGIAzqhFw&s=10",
    ],
  },
];

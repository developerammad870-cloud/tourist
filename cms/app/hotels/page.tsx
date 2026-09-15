import s from "../components/ui/ui.module.css";

/**
 * Hotels / stays page.
 *
 * These are remote hotlinks in plain <img> tags — no next/image, so no
 * `remotePatterns` config is needed, but they can vanish without notice.
 */

const shots = [
  "https://media.istockphoto.com/id/636484522/photo/hotel-resort-swimming-pool.jpg?s=612x612&w=0&k=20&c=ET-8reopQEIhH4YYee6tqlFpfKEg19oLRRCJX3-56rs=",
  "https://media.istockphoto.com/id/636948050/photo/luxury-construction-hotel-swimming-pool.jpg?s=612x612&w=0&k=20&c=dgmIyvr_E4yluDrcvZtWgkr_gq_ZS--rodGKYJr53C4=",
  "https://media.istockphoto.com/id/162137765/photo/summer-swimming-pool.jpg?s=612x612&w=0&k=20&c=Wv3DeS8S-yygZpJ6eE90iu7861DRVd177MlGTZVWd1I=",
  "https://media.istockphoto.com/id/1355094373/photo/luxury-beach-sea-view-pool-villa-3d-rendering.jpg?s=612x612&w=0&k=20&c=pMnXRZzCdJ05A3DTKlUIHRJUwGVtrIEivPMVk-MD4-k=",
  "https://media.gettyimages.com/id/1489994533/photo/sunlight-reflected-in-swimming-pool-puglia-italy.jpg?s=612x612&w=0&k=20&c=F2bDXBI3HT40b3xObXeOAz6Ah3IlVld3Y_M-aVdJ9Zg=",
];

export default function HotelsPage() {
  return (
    <div className={s.page}>
      <div className={s.head}>
        <p className={s.eyebrow}>Stays</p>
        <h1 className={s.title}>Where you&rsquo;ll sleep</h1>
        <p className={s.lede}>
          Our hotel is a symbol of luxury, comfort, and peace. We offer elegant
          rooms, world-class hospitality, and exceptional services to ensure
          every guest enjoys a memorable stay. Surrounded by a calm and
          welcoming atmosphere, it&rsquo;s the perfect base for relaxation,
          family holidays, business trips and special occasions.
        </p>
      </div>

      <div className={s.gallery}>
        {shots.map((src, i) => (
          <figure className={s.shot} key={src}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Hotel view ${i + 1}`} loading="lazy" />
          </figure>
        ))}
      </div>
    </div>
  );
}

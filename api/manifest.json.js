export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    short_name: "CharityLot",
    name: "CharityLot - Charity Ticket Platform",
    description: "Buy raffle tickets and support charity causes",
    icons: [
      {
        src: "https://charity-platform-blue.vercel.app/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://charity-platform-blue.vercel.app/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "https://charity-platform-blue.vercel.app/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://charity-platform-blue.vercel.app/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    start_url: "https://charity-platform-blue.vercel.app/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#2563eb",
    background_color: "#2563eb",
    scope: "https://charity-platform-blue.vercel.app/",
    lang: "en",
    id: "com.charitylot.app"
  });
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NutriScan",
    short_name: "NutriScan",
    description: "Scan your food, log your nutrition, eat smarter.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6ef",
    theme_color: "#f4f6ef",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

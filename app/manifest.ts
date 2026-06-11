import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GigFin",
    short_name: "GigFin",
    description: "Self-hosted income & expense ledger for gig workers.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b0f0d",
    theme_color: "#108050",
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

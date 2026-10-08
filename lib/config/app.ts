export const appConfig = {
  name: "TenderHub",
  shortName: "TenderHub",
  description:
    "A modern procurement platform connecting organizations and vendors.",
  tagline: "Smarter Procurement. Stronger Uganda.",
  url:
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000",

  support: {
    email:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
      "support@tenderhub.ug",
  },

  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  uploads: {
    maxFileSizeMb: 25,
  },
} as const;

export type AppConfig = typeof appConfig;
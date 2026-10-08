// lib/constants.ts

/**
 * Application Information
 */
export const APP_NAME = "TenderHub Uganda";

export const APP_DESCRIPTION =
  "Find verified government, NGO, and private sector tender opportunities across Uganda.";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Navigation
 */
export const NAV_LINKS = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Tenders",
    href: "/tenders",
  },
  {
    name: "Categories",
    href: "/categories",
  },
  {
    name: "Suppliers",
    href: "/suppliers",
  },
  {
    name: "News",
    href: "/news",
  },
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Contact",
    href: "/contact",
  },
];

/**
 * Tender Categories
 */
export const TENDER_CATEGORIES = [
  "Construction",
  "ICT & Technology",
  "Consultancy",
  "Supplies",
  "Healthcare",
  "Agriculture",
  "Transport & Logistics",
  "Education",
  "Energy",
  "Security",
];

/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  SUPPLIER: "supplier",
};

/**
 * Tender Status
 */
export const TENDER_STATUS = {
  OPEN: "Open",
  CLOSED: "Closed",
  AWARDED: "Awarded",
};

/**
 * Pagination
 */
export const PAGE_SIZE = 10;

/**
 * Contact Details
 */
export const CONTACT = {
  email: "info@tenderhub.ug",
  support: "support@tenderhub.ug",
  phone: "+256 700 123 456",
  address: "Kampala, Uganda",
};

/**
 * Social Media
 */
export const SOCIALS = {
  facebook: "#",
  twitter: "#",
  linkedin: "#",
  youtube: "#",
};
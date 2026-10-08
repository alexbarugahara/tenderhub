import { ClassificationType } from "@prisma/client";

export interface PscClassification {
  code: string;
  title: string;
  description?: string;
  group?: string;
  classCode?: string;
  subclass?: string;
}

export const PSC_CLASSIFICATION_TYPE = ClassificationType.PSC;

export const PSC_GROUPS = [
  { code: "10", title: "Weapons" },
  { code: "11", title: "Nuclear Ordinance" },
  { code: "12", title: "Fire Control Equipment" },
  { code: "13", title: "Ammunition and Explosives" },
  { code: "14", title: "Guided Missiles" },
  { code: "15", title: "Aircraft and Airframe Structural Components" },
  { code: "16", title: "Aircraft Components and Accessories" },
  { code: "17", title: "Aircraft Launching, Landing, and Ground Handling Equipment" },
  { code: "18", title: "Space Vehicles" },
  { code: "19", title: "Ships, Small Craft, Pontoons, and Floating Docks" },
  { code: "20", title: "Ship and Marine Equipment" },
  { code: "23", title: "Motor Vehicles, Trailers, and Cycles" },
  { code: "24", title: "Tractors" },
  { code: "25", title: "Vehicular Equipment Components" },
  { code: "26", title: "Tires and Tubes" },
  { code: "28", title: "Engines, Turbines, and Components" },
  { code: "29", title: "Engine Accessories" },
  { code: "30", title: "Mechanical Power Transmission Equipment" },
  { code: "31", title: "Bearings" },
  { code: "32", title: "Woodworking Machinery and Equipment" },
  { code: "34", title: "Metalworking Machinery" },
  { code: "35", title: "Service and Trade Equipment" },
  { code: "36", title: "Special Industry Machinery" },
  { code: "37", title: "Agriculture Machinery and Equipment" },
  { code: "38", title: "Construction, Mining, Excavating, and Highway Maintenance Equipment" },
  { code: "39", title: "Materials Handling Equipment" },
  { code: "40", title: "Rope, Cable, Chain, and Fittings" },
  { code: "41", title: "Refrigeration and Air Conditioning Equipment" },
  { code: "42", title: "Fire Fighting, Rescue, and Safety Equipment" },
  { code: "43", title: "Pumps and Compressors" },
  { code: "44", title: "Furnace, Steam Plant, and Drying Equipment" },
  { code: "45", title: "Plumbing, Heating, and Sanitation Equipment" },
  { code: "46", title: "Water Works Equipment" },
  { code: "47", title: "Pipe, Tubing, Hose, and Fittings" },
  { code: "48", title: "Valves" },
  { code: "49", title: "Maintenance and Repair Shop Equipment" },
  { code: "51", title: "Hand Tools" },
  { code: "52", title: "Measuring Tools" },
  { code: "53", title: "Hardware and Abrasives" },
  { code: "54", title: "Prefabricated Structures and Scaffolding" },
  { code: "55", title: "Lumber, Millwork, Plywood, and Veneer" },
  { code: "56", title: "Construction and Building Materials" },
  { code: "58", title: "Communication, Detection, and Coherent Radiation Equipment" },
  { code: "59", title: "Electrical and Electronic Equipment Components" },
  { code: "60", title: "Fiber Optics" },
  { code: "61", title: "Electric Wire and Power Distribution Equipment" },
  { code: "62", title: "Lighting Fixtures and Lamps" },
  { code: "63", title: "Alarm, Signal, and Security Detection Systems" },
  { code: "65", title: "Medical, Dental, and Veterinary Equipment and Supplies" },
  { code: "66", title: "Instruments and Laboratory Equipment" },
  { code: "67", title: "Photographic Equipment" },
  { code: "68", title: "Chemicals and Chemical Products" },
  { code: "69", title: "Training Aids and Devices" },
  { code: "70", title: "Information Technology Equipment" },
  { code: "71", title: "Furniture" },
  { code: "72", title: "Household and Commercial Furnishings and Appliances" },
  { code: "73", title: "Food Preparation and Serving Equipment" },
  { code: "74", title: "Office Equipment" },
  { code: "75", title: "Office Supplies and Devices" },
  { code: "76", title: "Books, Maps, and Other Publications" },
  { code: "77", title: "Musical Instruments, Phonographs, and Home-Type Radios" },
  { code: "78", title: "Recreational and Athletic Equipment" },
  { code: "79", title: "Cleaning Equipment and Supplies" },
  { code: "80", title: "Brushes, Paints, Sealers, and Adhesives" },
  { code: "81", title: "Containers, Packaging, and Packing Supplies" },
  { code: "83", title: "Textiles, Leather, Furs, Apparel and Shoe Findings" },
  { code: "84", title: "Clothing, Individual Equipment and Insignia" },
  { code: "85", title: "Toiletries" },
  { code: "87", title: "Agricultural Supplies" },
  { code: "88", title: "Live Animals" },
  { code: "89", title: "Subsistence" },
  { code: "91", title: "Fuels, Lubricants, Oils, and Waxes" },
  { code: "93", title: "Nonmetallic Fabricated Materials" },
  { code: "94", title: "Nonmetallic Crude Materials" },
  { code: "95", title: "Metal Bars, Sheets, and Shapes" },
  { code: "96", title: "Ores, Minerals, and Their Primary Products" },
  { code: "99", title: "Miscellaneous" },
] as const;

export function normalizePscCode(code: string): string {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

export function isValidPscCode(code: string): boolean {
  const normalized = normalizePscCode(code);

  return /^\d{2,4}$/.test(normalized);
}

export function getPscCodeLevel(code: string): number | null {
  const normalized = normalizePscCode(code);

  if (!isValidPscCode(normalized)) {
    return null;
  }

  return normalized.length;
}

export function isPscGroup(code: string): boolean {
  const normalized = normalizePscCode(code);

  return PSC_GROUPS.some((group) => group.code === normalized);
}

export function getPscGroup(
  code: string,
): (typeof PSC_GROUPS)[number] | undefined {
  const normalized = normalizePscCode(code);

  return PSC_GROUPS.find(
    (group) => group.code === normalized,
  );
}

export function getPscParentCode(
  code: string,
): string | null {
  const normalized = normalizePscCode(code);

  if (!isValidPscCode(normalized) || normalized.length <= 2) {
    return null;
  }

  return normalized.slice(0, normalized.length - 1);
}

export function isPscChildOf(
  code: string,
  parentCode: string,
): boolean {
  const child = normalizePscCode(code);
  const parent = normalizePscCode(parentCode);

  if (
    !isValidPscCode(child) ||
    !isValidPscCode(parent)
  ) {
    return false;
  }

  return child.startsWith(parent) && child.length > parent.length;
}

export function formatPscCode(code: string): string {
  return normalizePscCode(code);
}

export function createPscClassification(
  code: string,
  title: string,
  description?: string,
): PscClassification {
  const normalizedCode = normalizePscCode(code);

  if (!isValidPscCode(normalizedCode)) {
    throw new Error(`Invalid PSC code: ${code}`);
  }

  return {
    code: normalizedCode,
    title: title.trim(),
    description: description?.trim() || undefined,
  };
}

export function getPscClassificationType(): ClassificationType {
  return PSC_CLASSIFICATION_TYPE;
}
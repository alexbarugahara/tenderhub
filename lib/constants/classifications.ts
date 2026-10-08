export const CLASSIFICATION_TYPES = {
  NAICS: "NAICS",
  PSC: "PSC",
  UNSPSC: "UNSPSC",
  CUSTOM: "CUSTOM",
} as const;

export type ClassificationType =
  (typeof CLASSIFICATION_TYPES)[keyof typeof CLASSIFICATION_TYPES];

export const CLASSIFICATION_TYPE_LABELS: Record<
  ClassificationType,
  string
> = {
  NAICS: "NAICS",
  PSC: "PSC",
  UNSPSC: "UNSPSC",
  CUSTOM: "Custom",
};

export const CLASSIFICATION_TYPE_DESCRIPTIONS: Record<
  ClassificationType,
  string
> = {
  NAICS: "North American Industry Classification System",
  PSC: "Product and Service Codes",
  UNSPSC: "United Nations Standard Products and Services Code",
  CUSTOM: "Organization-defined classification",
};

export const CLASSIFICATION_TYPE_OPTIONS = [
  {
    value: CLASSIFICATION_TYPES.NAICS,
    label: CLASSIFICATION_TYPE_LABELS.NAICS,
    description: CLASSIFICATION_TYPE_DESCRIPTIONS.NAICS,
  },
  {
    value: CLASSIFICATION_TYPES.PSC,
    label: CLASSIFICATION_TYPE_LABELS.PSC,
    description: CLASSIFICATION_TYPE_DESCRIPTIONS.PSC,
  },
  {
    value: CLASSIFICATION_TYPES.UNSPSC,
    label: CLASSIFICATION_TYPE_LABELS.UNSPSC,
    description: CLASSIFICATION_TYPE_DESCRIPTIONS.UNSPSC,
  },
  {
    value: CLASSIFICATION_TYPES.CUSTOM,
    label: CLASSIFICATION_TYPE_LABELS.CUSTOM,
    description: CLASSIFICATION_TYPE_DESCRIPTIONS.CUSTOM,
  },
] as const;

export function isValidClassificationType(
  value: unknown,
): value is ClassificationType {
  return (
    typeof value === "string" &&
    Object.values(CLASSIFICATION_TYPES).includes(
      value as ClassificationType,
    )
  );
}

export function getClassificationTypeLabel(
  type: ClassificationType,
): string {
  return CLASSIFICATION_TYPE_LABELS[type];
}

export function getClassificationTypeDescription(
  type: ClassificationType,
): string {
  return CLASSIFICATION_TYPE_DESCRIPTIONS[type];
}
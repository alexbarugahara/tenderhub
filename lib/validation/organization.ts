export type OrganizationValidationInput = {
  name?: unknown;
  description?: unknown;
  email?: unknown;
  phone?: unknown;
  website?: unknown;
  address?: unknown;
  country?: unknown;
};

export type OrganizationValidationResult = {
  success: boolean;
  errors: Record<string, string>;
  data?: {
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    country?: string;
  };
};

function getOptionalString(
  value: unknown,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export function validateOrganization(
  input: OrganizationValidationInput,
): OrganizationValidationResult {
  const errors: Record<string, string> = {};

  const name =
    typeof input.name === "string"
      ? input.name.trim()
      : "";

  const description = getOptionalString(
    input.description,
  );

  const email = getOptionalString(input.email);
  const phone = getOptionalString(input.phone);
  const website = getOptionalString(input.website);
  const address = getOptionalString(input.address);
  const country = getOptionalString(input.country);

  if (!name) {
    errors.name = "Organization name is required.";
  } else if (name.length < 2) {
    errors.name =
      "Organization name must be at least 2 characters.";
  } else if (name.length > 200) {
    errors.name =
      "Organization name must not exceed 200 characters.";
  }

  if (description && description.length > 2000) {
    errors.description =
      "Description must not exceed 2,000 characters.";
  }

  if (email && !isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (phone && phone.length > 50) {
    errors.phone =
      "Phone number must not exceed 50 characters.";
  }

  if (website && !isValidUrl(website)) {
    errors.website =
      "Enter a valid website URL.";
  }

  if (address && address.length > 500) {
    errors.address =
      "Address must not exceed 500 characters.";
  }

  if (country && country.length > 100) {
    errors.country =
      "Country must not exceed 100 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    errors: {},
    data: {
      name,
      ...(description ? { description } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(website ? { website } : {}),
      ...(address ? { address } : {}),
      ...(country ? { country } : {}),
    },
  };
}

export function isValidOrganizationName(
  name: unknown,
): boolean {
  return validateOrganization({ name }).success;
}
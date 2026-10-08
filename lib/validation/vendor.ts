export type VendorValidationInput = {
  /**
   * Legacy/general vendor name.
   *
   * Kept for compatibility with existing callers.
   * New vendor onboarding should preferably use companyName.
   */
  name?: unknown;

  companyName?: unknown;
  legalName?: unknown;

  description?: unknown;

  email?: unknown;
  phone?: unknown;
  website?: unknown;
  address?: unknown;

  country?: unknown;
  countryId?: unknown;

  registrationNumber?: unknown;
  taxNumber?: unknown;

  businessType?: unknown;

  numberOfEmployees?: unknown;
  employees?: unknown;

  yearsOperating?: unknown;

  operatingLocations?: unknown;
  portfolioDescription?: unknown;
};

export type VendorValidationData = {
  name: string;

  companyName?: string;
  legalName?: string;

  description?: string;

  email?: string;
  phone?: string;
  website?: string;
  address?: string;

  country?: string;
  countryId?: string;

  registrationNumber?: string;
  taxNumber?: string;

  businessType?: string;

  numberOfEmployees?: number;
  employees?: number;

  yearsOperating?: number;

  operatingLocations?: string;
  portfolioDescription?: string;
};

export type VendorValidationResult = {
  success: boolean;
  errors: Record<string, string>;
  data?: VendorValidationData;
};

function getOptionalString(
  value: unknown
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

function getOptionalNumber(
  value: unknown
): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
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

function validateStringLength(
  value: string | undefined,
  maxLength: number
): boolean {
  return !value || value.length <= maxLength;
}

export function validateVendor(
  input: VendorValidationInput
): VendorValidationResult {
  const errors: Record<string, string> = {};

  /*
   * ---------------------------------------------------------
   * BASIC IDENTITY
   * ---------------------------------------------------------
   */

  const legacyName =
    typeof input.name === "string"
      ? input.name.trim()
      : "";

  const companyName = getOptionalString(
    input.companyName
  );

  const legalName = getOptionalString(
    input.legalName
  );

  /*
   * Prefer companyName for the new onboarding workflow.
   *
   * name remains supported because older routes/components
   * may still send it.
   */
  const name =
    companyName ||
    legalName ||
    legacyName;

  if (!name) {
    errors.name = "Vendor name is required.";
  } else if (name.length < 2) {
    errors.name =
      "Vendor name must be at least 2 characters.";
  } else if (name.length > 200) {
    errors.name =
      "Vendor name must not exceed 200 characters.";
  }

  if (
    companyName &&
    companyName.length > 200
  ) {
    errors.companyName =
      "Company name must not exceed 200 characters.";
  }

  if (
    legalName &&
    legalName.length > 200
  ) {
    errors.legalName =
      "Legal name must not exceed 200 characters.";
  }

  /*
   * ---------------------------------------------------------
   * DESCRIPTION
   * ---------------------------------------------------------
   */

  const description = getOptionalString(
    input.description
  );

  if (
    description &&
    description.length > 2000
  ) {
    errors.description =
      "Description must not exceed 2,000 characters.";
  }

  /*
   * ---------------------------------------------------------
   * CONTACT DETAILS
   * ---------------------------------------------------------
   */

  const email = getOptionalString(
    input.email
  );

  const phone = getOptionalString(
    input.phone
  );

  const website = getOptionalString(
    input.website
  );

  const address = getOptionalString(
    input.address
  );

  if (
    email &&
    !isValidEmail(email)
  ) {
    errors.email =
      "Enter a valid email address.";
  }

  if (
    email &&
    email.length > 254
  ) {
    errors.email =
      "Email address must not exceed 254 characters.";
  }

  if (
    phone &&
    phone.length > 50
  ) {
    errors.phone =
      "Phone number must not exceed 50 characters.";
  }

  if (
    website &&
    !isValidUrl(website)
  ) {
    errors.website =
      "Enter a valid website URL.";
  }

  if (
    address &&
    address.length > 500
  ) {
    errors.address =
      "Address must not exceed 500 characters.";
  }

  /*
   * ---------------------------------------------------------
   * COUNTRY
   * ---------------------------------------------------------
   */

  const country = getOptionalString(
    input.country
  );

  const countryId = getOptionalString(
    input.countryId
  );

  if (
    country &&
    country.length > 100
  ) {
    errors.country =
      "Country must not exceed 100 characters.";
  }

  /*
   * ---------------------------------------------------------
   * LEGAL / REGISTRATION INFORMATION
   * ---------------------------------------------------------
   */

  const registrationNumber =
    getOptionalString(
      input.registrationNumber
    );

  const taxNumber =
    getOptionalString(
      input.taxNumber
    );

  if (
    registrationNumber &&
    registrationNumber.length > 100
  ) {
    errors.registrationNumber =
      "Registration number must not exceed 100 characters.";
  }

  if (
    taxNumber &&
    taxNumber.length > 100
  ) {
    errors.taxNumber =
      "Tax number must not exceed 100 characters.";
  }

  /*
   * ---------------------------------------------------------
   * BUSINESS INFORMATION
   * ---------------------------------------------------------
   */

  const businessType =
    getOptionalString(
      input.businessType
    );

  if (
    businessType &&
    businessType.length > 100
  ) {
    errors.businessType =
      "Business type must not exceed 100 characters.";
  }

  /*
   * ---------------------------------------------------------
   * EMPLOYEES
   * ---------------------------------------------------------
   */

  const numberOfEmployees =
    getOptionalNumber(
      input.numberOfEmployees
    );

  const employees =
    getOptionalNumber(
      input.employees
    );

  /*
   * Support both names, but use the actual
   * Vendor model field: numberOfEmployees.
   */
  const employeeCount =
    numberOfEmployees ??
    employees;

  if (
    input.numberOfEmployees !== undefined &&
    input.numberOfEmployees !== null &&
    input.numberOfEmployees !== "" &&
    numberOfEmployees === undefined
  ) {
    errors.numberOfEmployees =
      "Number of employees must be a valid number.";
  }

  if (
    input.employees !== undefined &&
    input.employees !== null &&
    input.employees !== "" &&
    employees === undefined
  ) {
    errors.employees =
      "Number of employees must be a valid number.";
  }

  if (
    employeeCount !== undefined
  ) {
    if (
      !Number.isInteger(employeeCount)
    ) {
      errors.numberOfEmployees =
        "Number of employees must be a whole number.";
    } else if (
      employeeCount < 0
    ) {
      errors.numberOfEmployees =
        "Number of employees cannot be negative.";
    } else if (
      employeeCount > 10000000
    ) {
      errors.numberOfEmployees =
        "Number of employees is outside the allowed range.";
    }
  }

  /*
   * ---------------------------------------------------------
   * YEARS OPERATING
   * ---------------------------------------------------------
   */

  const yearsOperating =
    getOptionalNumber(
      input.yearsOperating
    );

  if (
    input.yearsOperating !== undefined &&
    input.yearsOperating !== null &&
    input.yearsOperating !== "" &&
    yearsOperating === undefined
  ) {
    errors.yearsOperating =
      "Years operating must be a valid number.";
  }

  if (
    yearsOperating !== undefined
  ) {
    if (
      yearsOperating < 0
    ) {
      errors.yearsOperating =
        "Years operating cannot be negative.";
    } else if (
      yearsOperating > 200
    ) {
      errors.yearsOperating =
        "Years operating must not exceed 200 years.";
    }
  }

  /*
   * ---------------------------------------------------------
   * OPERATING LOCATIONS
   * ---------------------------------------------------------
   */

  const operatingLocations =
    getOptionalString(
      input.operatingLocations
    );

  if (
    operatingLocations &&
    operatingLocations.length > 2000
  ) {
    errors.operatingLocations =
      "Operating locations must not exceed 2,000 characters.";
  }

  /*
   * ---------------------------------------------------------
   * PORTFOLIO / EXPERIENCE
   * ---------------------------------------------------------
   */

  const portfolioDescription =
    getOptionalString(
      input.portfolioDescription
    );

  if (
    portfolioDescription &&
    portfolioDescription.length > 5000
  ) {
    errors.portfolioDescription =
      "Portfolio description must not exceed 5,000 characters.";
  }

  /*
   * ---------------------------------------------------------
   * FINAL VALIDATION
   * ---------------------------------------------------------
   */

  if (
    Object.keys(errors).length > 0
  ) {
    return {
      success: false,
      errors,
    };
  }

  /*
   * Preserve the old `name` property because existing
   * callers may depend on it.
   *
   * The new onboarding workflow can additionally use
   * companyName and legalName.
   */
  return {
    success: true,
    errors: {},
    data: {
      name,

      ...(companyName
        ? { companyName }
        : {}),

      ...(legalName
        ? { legalName }
        : {}),

      ...(description
        ? { description }
        : {}),

      ...(email
        ? { email }
        : {}),

      ...(phone
        ? { phone }
        : {}),

      ...(website
        ? { website }
        : {}),

      ...(address
        ? { address }
        : {}),

      ...(country
        ? { country }
        : {}),

      ...(countryId
        ? { countryId }
        : {}),

      ...(registrationNumber
        ? { registrationNumber }
        : {}),

      ...(taxNumber
        ? { taxNumber }
        : {}),

      ...(businessType
        ? { businessType }
        : {}),

      ...(employeeCount !== undefined
        ? {
            numberOfEmployees:
              employeeCount,
            employees:
              employeeCount,
          }
        : {}),

      ...(yearsOperating !== undefined
        ? {
            yearsOperating,
          }
        : {}),

      ...(operatingLocations
        ? {
            operatingLocations,
          }
        : {}),

      ...(portfolioDescription
        ? {
            portfolioDescription,
          }
        : {}),
    },
  };
}

export function isValidVendorName(
  name: unknown
): boolean {
  return validateVendor({
    name,
  }).success;
}
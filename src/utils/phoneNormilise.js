import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export const normalizePhone = (phoneValue) => {
  let phone = String(phoneValue ?? "").trim();

  if (!phone) {
    const error = new Error("Phone number is required.");
    error.statusCode = 400;
    throw error;
  }

  // Remove spaces, brackets, hyphens etc.
  // Keep + because it identifies the country calling code.
  phone = phone.replace(/[^\d+]/g, "");

  // International number must start with +
  if (!phone.startsWith("+")) {
    const error = new Error(
      "Please enter phone number with country code, e.g. +919876543210."
    );
    error.statusCode = 400;
    throw error;
  }

  const parsedPhone = parsePhoneNumberFromString(phone);

  if (!parsedPhone || !parsedPhone.isValid()) {
    const error = new Error("Please enter a valid phone number.");
    error.statusCode = 400;
    throw error;
  }

  return {
    phone: parsedPhone.nationalNumber,
    countryCode: `+${parsedPhone.countryCallingCode}`,
    country: parsedPhone.country || null,
    fullPhone: parsedPhone.number,
  };
};
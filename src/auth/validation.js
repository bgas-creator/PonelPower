const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validateRegistration(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const errors = [];
  const fullname = typeof input.fullname === "string" ? input.fullname.trim() : "";
  const email = normalizeEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  const countryProvided = input.country !== undefined && input.country !== null;
  const countryValue = typeof input.country === "string" ? input.country.trim() : null;
  const country = countryValue === "" ? null : countryValue;

  if (!fullname || fullname.length > 255) {
    errors.push("fullname must be between 1 and 255 characters");
  }
  if (!email || email.length > 255 || !EMAIL_PATTERN.test(email)) {
    errors.push("email must be a valid email address of at most 255 characters");
  }
  if (Buffer.byteLength(password, "utf8") < 8 || Buffer.byteLength(password, "utf8") > 72) {
    errors.push("password must be between 8 and 72 bytes");
  }
  if (countryProvided && country === null) {
    errors.push("country must be a string");
  } else if (country !== null && country.length > 100) {
    errors.push("country must be at most 100 characters");
  }

  return {
    errors,
    values: { fullname, email, password, country },
  };
}

function validateLogin(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const errors = [];
  const email = normalizeEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";

  if (!email || email.length > 255 || !EMAIL_PATTERN.test(email)) {
    errors.push("email must be a valid email address");
  }
  if (!password) {
    errors.push("password is required");
  }

  return { errors, values: { email, password } };
}

module.exports = { normalizeEmail, validateLogin, validateRegistration };

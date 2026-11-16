const test = require("node:test");
const assert = require("node:assert/strict");
const { validateLogin, validateRegistration } = require("../src/auth/validation");

test("registration trims names and normalizes email", () => {
  const result = validateRegistration({
    fullname: "  Alex User ",
    email: "  ALEX@example.com ",
    password: "a-secure-password",
    country: "  Canada ",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.values.fullname, "Alex User");
  assert.equal(result.values.email, "alex@example.com");
  assert.equal(result.values.country, "Canada");
});

test("registration rejects passwords outside bcrypt's supported byte length", () => {
  const result = validateRegistration({
    fullname: "Alex User",
    email: "alex@example.com",
    password: "x".repeat(73),
  });

  assert.ok(result.errors.some((error) => error.startsWith("password")));
});

test("login rejects missing passwords", () => {
  const result = validateLogin({ email: "alex@example.com" });

  assert.ok(result.errors.includes("password is required"));
});

test("validation returns client errors for missing or non-object bodies", () => {
  assert.ok(validateRegistration(undefined).errors.length > 0);
  assert.ok(validateLogin(null).errors.length > 0);
});

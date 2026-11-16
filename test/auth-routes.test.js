const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const createApp = require("../src/app");

test("registration, login, and authenticated profile flow", async (t) => {
  const users = [];
  const pool = {
    async query(sql, values) {
      if (sql.includes("INSERT INTO users")) {
        if (users.some((user) => user.email === values[2])) {
          const error = new Error("duplicate email");
          error.code = "23505";
          error.constraint = "users_email_unique";
          throw error;
        }
        const user = {
          id: values[0],
          fullname: values[1],
          email: values[2],
          password_hash: values[3],
          role: values[4],
          country: values[5],
          created_at: new Date().toISOString(),
        };
        users.push(user);
        const { password_hash, ...publicUser } = user;
        return { rows: [publicUser] };
      }

      if (sql.includes("WHERE LOWER(email) = $1")) {
        return { rows: users.filter((user) => user.email === values[0]) };
      }

      if (sql.includes("WHERE id = $1")) {
        const user = users.find((candidate) => candidate.id === values[0]);
        if (!user) return { rows: [] };
        const { password_hash, ...publicUser } = user;
        return { rows: [publicUser] };
      }

      throw new Error("Unexpected query");
    },
  };
  const server = createApp({ pool, jwtSecret: "test-secret-with-more-than-32-characters" })
    .listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;
  const registration = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fullname: "Alex User",
      email: "ALEX@example.com",
      password: "a-secure-password",
      role: "admin",
    }),
  });
  const registered = await registration.json();

  assert.equal(registration.status, 201);
  assert.equal(registered.user.role, "buyer");
  assert.equal("password_hash" in registered.user, false);

  const duplicate = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fullname: "Another User",
      email: "alex@example.com",
      password: "a-secure-password",
    }),
  });
  assert.equal(duplicate.status, 409);

  const login = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: " alex@example.com ", password: "a-secure-password" }),
  });
  const loggedIn = await login.json();
  assert.equal(login.status, 200);
  assert.equal(loggedIn.user.email, "alex@example.com");
  assert.equal("password_hash" in loggedIn.user, false);
  assert.ok(await bcrypt.compare("a-secure-password", users[0].password_hash));

  const profile = await fetch(`${baseUrl}/me`, {
    headers: { authorization: `Bearer ${loggedIn.token}` },
  });
  const profileBody = await profile.json();
  assert.equal(profile.status, 200);
  assert.equal(profileBody.user.id, registered.user.id);

  const invalidToken = await fetch(`${baseUrl}/me`, {
    headers: { authorization: `Bearer ${randomUUID()}` },
  });
  assert.equal(invalidToken.status, 401);
});

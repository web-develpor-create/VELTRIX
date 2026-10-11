// Create admin account with user-provided credentials
// Usage: bun run scripts/create-admin.ts
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/crypto";

async function main() {
  const email = "chuzidp@gmail.com";
  const password = "Admin098@";
  const name = "Admin";

  // Delete the previous test admin (and any existing account with this email)
  await db.user.deleteMany({ where: { email: "admin@veltrix.test" } }).catch(() => {});
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    // Promote / reset to admin with the new password
    const updated = await db.user.update({
      where: { email },
      data: {
        passwordHash: hashPassword(password),
        role: "admin",
        status: "active",
        name,
      },
    });
    console.log(`Updated existing user to admin: ${updated.email} (id=${updated.id})`);
  } else {
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
        role: "admin",
        status: "active",
      },
    });
    console.log(`Created admin account: ${user.email} (id=${user.id})`);
  }

  // Show all users
  const all = await db.user.findMany({ select: { id: true, email: true, role: true, status: true } });
  console.log("\nCurrent users in database:");
  for (const u of all) console.log(`  - ${u.email} | ${u.role} | ${u.status}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());

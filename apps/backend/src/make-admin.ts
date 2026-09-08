import 'dotenv/config';
import { db } from '../../../packages/database';
import { user } from '../../../packages/database/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('❌ Please provide an email address.');
    console.log('Usage: bun src/make-admin.ts <user-email>');
    process.exit(1);
  }

  const updated = await db
    .update(user)
    .set({ role: 'admin' })
    .where(eq(user.email, email))
    .returning();

  if (updated.length === 0) {
    console.error(`❌ User with email "${email}" not found in database.`);
  } else {
    console.log(`🎉 Success! User "${updated[0].name}" (${updated[0].email}) is now an 'admin'.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error updating user role:', err);
  process.exit(1);
});

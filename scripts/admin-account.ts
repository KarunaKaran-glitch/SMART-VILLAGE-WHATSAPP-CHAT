// Creates an admin account for the website login, or gives an existing one a new password.
// Run by the people who look after the server (for example the CSIR website team):
//
//   npm.cmd run admin -- SVADMIN                  website-only admin with the Admin ID SVADMIN
//   npm.cmd run admin -- SVADMIN 9944879278       the same, and WhatsApp notices go to that phone
//   npm.cmd run admin -- SVADMIN                  (again) a new password for SVADMIN
//
// A new password is made and printed once: give it to the admin, who can change it on the
// admin page (Home > My account). Passwords are stored only as scrypt hashes.
import crypto from 'crypto';
import { prisma } from '../src/db';
import { hashPassword, normalAdminCode } from '../src/adminAuth';

// 12 characters without look-alikes (no 0/O, 1/l/I)
function newPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 12 }, () => chars[crypto.randomInt(chars.length)]).join('');
}

async function main() {
  const [rawId, rawPhone] = process.argv.slice(2);
  const adminCode = normalAdminCode(rawId);
  if (!/^[A-Z0-9-]{3,20}$/.test(adminCode)) {
    console.log('Usage: npm.cmd run admin -- <ADMIN-ID> [10-digit WhatsApp number]');
    console.log('The Admin ID is 3 to 20 letters, numbers or "-", for example SVADMIN or ADM-1001.');
    process.exitCode = 1;
    return;
  }
  let phone: string | null = null;
  if (rawPhone) {
    const digits = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
    phone = digits.length === 10 ? `91${digits}` : digits;
    if (!/^\d{11,15}$/.test(phone)) {
      console.log('The WhatsApp number should be 10 digits, for example 9944879278.');
      process.exitCode = 1;
      return;
    }
  }

  const password = newPassword();
  const passwordHash = hashPassword(password);
  const existing = await prisma.user.findUnique({ where: { adminCode } });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      console.log(`${adminCode} belongs to a user who is not an admin. Choose another Admin ID.`);
      process.exitCode = 1;
      return;
    }
    // A new password; the old one and any open admin page stop working
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, dashToken: null, dashTokenAt: null } });
    console.log(`New password for ${adminCode}.`);
  } else if (phone) {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (user?.role === 'SELLER') {
      console.log(`+${phone} is a seller. Remove the seller first, or use another number.`);
      process.exitCode = 1;
      return;
    }
    if (user?.role === 'ADMIN' && user.adminCode) {
      console.log(`+${phone} is already the admin ${user.adminCode}. Run: npm.cmd run admin -- ${user.adminCode}`);
      process.exitCode = 1;
      return;
    }
    await prisma.user.upsert({
      where: { phone },
      update: { role: 'ADMIN', state: 'BROWSING', adminCode, passwordHash },
      create: { phone, name: adminCode, role: 'ADMIN', state: 'BROWSING', language: 'en', adminCode, passwordHash },
    });
    console.log(`Admin ${adminCode} created. WhatsApp notices go to +${phone}.`);
  } else {
    // Website only: no WhatsApp number (the app sends nothing to it)
    await prisma.user.create({
      data: { phone: `web-${adminCode.toLowerCase()}`, name: adminCode, role: 'ADMIN', state: 'BROWSING', language: 'en', adminCode, passwordHash },
    });
    console.log(`Admin ${adminCode} created (website only, no WhatsApp number).`);
  }
  console.log('');
  console.log(`  Admin ID:  ${adminCode}`);
  console.log(`  Password:  ${password}`);
  console.log('');
  console.log('Give these to the admin. The password is shown only now; it can be changed on the admin page.');
}

main()
  .catch((err) => {
    console.error('Could not save the admin:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/common/password.util';

const prisma = new PrismaClient();

interface SeedPriceItem {
  category: string; subcategory: string | null; name: string; description: string; priceLbp: number; unit: string; sortOrder: number;
}

async function main() {
  // Price list (source: docs/Global_Laundry_Price_List.xlsx). Only seeded into an empty table so admin edits are kept.
  if ((await prisma.priceItem.count()) === 0) {
    const items: SeedPriceItem[] = JSON.parse(readFileSync(path.join(__dirname, 'data', 'price-items.json'), 'utf8'));
    await prisma.priceItem.createMany({ data: items });
    console.log(`Seeded ${items.length} price items.`);
  }

  // Sample Moms so the booking flow works on a fresh install. Edit or deactivate them in Admin → Moms.
  if ((await prisma.mom.count()) === 0) {
    await prisma.mom.createMany({
      data: [
        { name: 'Mom Rita', areas: ['Achrafieh', 'Badaro', 'Sin El Fil', 'Dekwaneh'], bio: 'Sample profile. Careful with whites and delicate fabrics.' },
        { name: 'Mom Nada', areas: ['Hamra', 'Ras Beirut', 'Verdun', 'Mar Mikhael'], bio: 'Sample profile. Ironing perfectionist, shirts come back crisp.' },
        { name: 'Mom Hiba', areas: ['Jounieh', 'Kaslik', 'Zouk', 'Jbeil'], bio: 'Sample profile. Great with bedding, curtains and big family loads.' },
        { name: 'Mom Carla', areas: ['Antelias', 'Dbayeh', 'Jal El Dib', 'Zalka', 'Jdeideh'], bio: 'Sample profile. Kids clothes and stain care specialist.' },
      ],
    });
    console.log('Seeded 4 sample Moms.');
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (!existing) {
      await prisma.adminUser.create({ data: { email, passwordHash: hashPassword(password), role: 'ADMIN' } });
      console.log(`Created admin ${email}. Remove ADMIN_PASSWORD from .env now.`);
    }
  } else if ((await prisma.adminUser.count()) === 0) {
    console.warn('No admin account yet: set ADMIN_EMAIL and ADMIN_PASSWORD in .env and run `npm run seed` again.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

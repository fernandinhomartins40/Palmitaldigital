import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Veículos', slug: 'veiculos', iconName: 'car' },
    { name: 'Imóveis', slug: 'imoveis', iconName: 'home' },
    { name: 'Eletrônicos', slug: 'eletronicos', iconName: 'smartphone' },
    { name: 'Roupas e Acessórios', slug: 'roupas', iconName: 'shirt' },
    { name: 'Móveis e Decoração', slug: 'moveis', iconName: 'sofa' },
    { name: 'Empregos', slug: 'empregos', iconName: 'briefcase' },
    { name: 'Serviços', slug: 'servicos', iconName: 'wrench' },
    { name: 'Animais', slug: 'animais', iconName: 'paw' },
    { name: 'Esportes', slug: 'esportes', iconName: 'dumbbell' },
    { name: 'Outros', slug: 'outros', iconName: 'package' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123456';
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@palmital.digital' },
    update: {},
    create: {
      email: 'admin@palmital.digital',
      passwordHash: adminHash,
      role: 'ADMIN',
      profile: {
        create: {
          displayName: 'Admin Palmital',
          city: 'Palmital',
        },
      },
    },
  });

  console.log('Seed completed. Admin:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

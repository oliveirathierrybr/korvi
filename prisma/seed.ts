import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { categoryColorLight } from "../src/lib/colors";
import { DEFAULT_CATEGORIES } from "../src/lib/default-categories";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@empresa.com";
  const password = "mudar123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Administrador",
      companyName: "Minha Empresa",
      cnpj: "",
    },
  });

  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const c = DEFAULT_CATEGORIES[i];
    await prisma.category.upsert({
      where: { userId_name_type: { userId: user.id, name: c.name, type: c.type } },
      update: {},
      create: {
        userId: user.id,
        name: c.name,
        type: c.type,
        color: categoryColorLight(i),
      },
    });
  }

  console.log("Seed concluído.");
  console.log(`Login: ${email} / Senha: ${password}`);
  console.log(`Usuário: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

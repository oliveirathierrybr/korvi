import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { categoryColorLight } from "../src/lib/colors";
import { DEFAULT_CATEGORIES } from "../src/lib/default-categories";

// Mesmo critério de "produção de verdade" usado em getBankProvider
// (src/lib/bank/get-bank-provider.ts) — VERCEL_ENV distingue Produção de
// Preview, já que a Vercel builda os dois com NODE_ENV=production. Sem essa
// checagem, rodar `npm run seed` contra o Neon de produção criaria uma conta
// com credencial fixa e documentada no repositório.
function isRealProductionEnvironment() {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "production";
  }
  return process.env.NODE_ENV === "production";
}

if (isRealProductionEnvironment()) {
  console.error("Seed bloqueado: não é permitido rodar em ambiente de produção.");
  process.exit(1);
}

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

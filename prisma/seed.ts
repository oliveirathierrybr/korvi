import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { categoryColorLight } from "../src/lib/colors";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const categories: { name: string; type: "ENTRADA" | "SAIDA" }[] = [
  { name: "Vendas", type: "ENTRADA" },
  { name: "Serviços", type: "ENTRADA" },
  { name: "Outras Receitas", type: "ENTRADA" },
  { name: "Fornecedores", type: "SAIDA" },
  { name: "Salários", type: "SAIDA" },
  { name: "Aluguel", type: "SAIDA" },
  { name: "Impostos", type: "SAIDA" },
  { name: "Marketing", type: "SAIDA" },
  { name: "Despesas Operacionais", type: "SAIDA" },
  { name: "Outras Despesas", type: "SAIDA" },
];

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
    },
  });

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    await prisma.category.upsert({
      where: { name_type: { name: c.name, type: c.type } },
      update: {},
      create: {
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

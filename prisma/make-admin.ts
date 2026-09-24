/**
 * Promotes an existing user to ADMIN by e-mail.
 *
 * Usage:  npm run make-admin -- email@exemplo.com
 *
 * The user must have registered first (at /conta). Their password is never
 * touched — only the role is changed. After promotion, the user must log out
 * and log in again so the new session carries the ADMIN role.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("❌ Informe o e-mail: npm run make-admin -- seu-email@exemplo.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌ Nenhuma conta encontrada com o e-mail "${email}".`);
    console.error("   Registre-se primeiro em /conta e tente de novo.");
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`ℹ️  "${email}" já é administrador.`);
    return;
  }

  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`✅ "${email}" agora é ADMINISTRADOR.`);
  console.log("   Saia e entre novamente para ativar o acesso ao painel /admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

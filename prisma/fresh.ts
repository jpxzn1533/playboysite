/**
 * Clean/production initialization.
 * Wipes ALL data (products, users, carts, orders, deliveries, logs) and
 * recreates only the base categories, so the store starts on real data.
 *
 * Run with:  npm run db:fresh
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const CATEGORIES = [
  "Nitro & Assinaturas",
  "Boosts de Servidor",
  "Cargos & VIP",
  "Bots & Automação",
  "Serviços",
  "Gift Cards",
];

async function main() {
  console.log("🧹 Limpando o banco (removendo dados de exemplo)...");

  // Order matters for foreign keys.
  await prisma.adminLog.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("📁 Criando categorias base...");
  for (const name of CATEGORIES) {
    await prisma.category.create({ data: { name, slug: slugify(name) } });
  }

  console.log("✅ Banco pronto para dados reais.");
  console.log("   • 0 produtos, 0 clientes, 0 pedidos, 0 carrinhos");
  console.log(`   • ${CATEGORIES.length} categorias criadas`);
  console.log("");
  console.log("Próximos passos:");
  console.log("   1) Registre sua conta em /conta");
  console.log('   2) Rode: npm run make-admin -- seu-email@exemplo.com');
  console.log("   3) Saia e entre novamente para ativar o acesso admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

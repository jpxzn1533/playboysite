/**
 * Idempotent: makes sure the base categories exist. Safe to run on every deploy
 * (Vercel build) — it never deletes anything and only creates missing categories.
 * Failures are non-fatal so a transient DB hiccup never blocks a deploy.
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
  for (const name of CATEGORIES) {
    const slug = slugify(name);
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }
  const count = await prisma.category.count();
  console.log(`✅ Categorias garantidas (${count} no total).`);
}

main()
  .catch((e) => {
    // Non-fatal: don't block the build.
    console.error("⚠️  ensure-categories falhou (seguindo mesmo assim):", e?.message ?? e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

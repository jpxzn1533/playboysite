// Runs the database setup (create tables + base categories) during the build,
// but ONLY when DATABASE_URL is configured. If it is missing, the build does not
// hard-fail — it skips with a clear message so you can add the variable on Vercel
// and redeploy.
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL;

if (!url || url.trim() === "") {
  console.warn(
    "\n⚠️  DATABASE_URL não está definido — pulando a preparação do banco.\n" +
      "    Defina DATABASE_URL nas Environment Variables da Vercel e faça um novo deploy.\n"
  );
  process.exit(0);
}

try {
  console.log("→ Sincronizando o schema do banco (prisma db push)...");
  execSync("prisma db push --skip-generate", { stdio: "inherit" });

  console.log("→ Garantindo categorias base...");
  execSync("tsx prisma/ensure-categories.ts", { stdio: "inherit" });

  console.log("✅ Banco pronto.");
} catch (err) {
  console.error("❌ Falha ao preparar o banco:", err?.message ?? err);
  process.exit(1);
}

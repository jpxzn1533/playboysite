import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/900/900`;
}

async function main() {
  console.log("🌱 Seeding PlayBoy Store...");

  // Clean slate (order matters for FKs)
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

  // ---- Users ----
  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@playboystore.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      discordName: "playboy.admin",
      discordId: "100000000000000001",
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Lucas Ferreira",
      email: "cliente@playboystore.com",
      passwordHash: await bcrypt.hash("cliente123", 10),
      role: "CUSTOMER",
      discordName: "lucas.f",
      discordId: "200000000000000002",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Marina Souza",
      email: "marina@playboystore.com",
      passwordHash: await bcrypt.hash("cliente123", 10),
      role: "CUSTOMER",
      discordName: "marina.s",
      discordId: "200000000000000003",
    },
  });

  // ---- Categories ----
  const catNames = [
    "Nitro & Assinaturas",
    "Boosts de Servidor",
    "Cargos & VIP",
    "Bots & Automação",
    "Serviços",
    "Gift Cards",
  ];
  const categories: Record<string, { id: string }> = {};
  for (const name of catNames) {
    const c = await prisma.category.create({
      data: { name, slug: slugify(name) },
    });
    categories[name] = c;
  }

  // ---- Products ----
  type P = {
    name: string;
    short: string;
    desc: string;
    price: number;
    promo?: number;
    stock: number;
    cat: string;
    featured?: boolean;
    best?: boolean;
    sold?: number;
    images: string[];
  };

  const products: P[] = [
    {
      name: "Discord Nitro — 1 Mês",
      short: "Nitro completo por 30 dias, entrega imediata via Discord.",
      desc:
        "Aproveite o Discord Nitro completo por 1 mês: uploads de até 500MB, emojis animados em qualquer servidor, badge exclusiva, perfil personalizado e 2 boosts de servidor inclusos. Entrega feita diretamente pela nossa equipe no Discord após a confirmação.",
      price: 34.9,
      promo: 27.9,
      stock: 42,
      cat: "Nitro & Assinaturas",
      featured: true,
      best: true,
      sold: 318,
      images: [img("nitro1"), img("nitro1b"), img("nitro1c")],
    },
    {
      name: "Discord Nitro — 1 Ano",
      short: "12 meses de Nitro com o melhor custo-benefício da loja.",
      desc:
        "Plano anual do Discord Nitro. Todos os benefícios premium por 12 meses com desconto especial. Ideal para quem vive no Discord e quer aproveitar tudo sem interrupções.",
      price: 349.9,
      promo: 289.9,
      stock: 15,
      cat: "Nitro & Assinaturas",
      featured: true,
      best: true,
      sold: 96,
      images: [img("nitroyear"), img("nitroyearb")],
    },
    {
      name: "Server Boost — Nível 3 (14 Boosts)",
      short: "Leve seu servidor ao nível máximo instantaneamente.",
      desc:
        "Pacote com 14 boosts para desbloquear o Nível 3 do seu servidor: qualidade de áudio 384kbps, uploads de 100MB para todos, 60 emojis extras, banner animado e vanity URL. Entrega manual acompanhada pela nossa equipe.",
      price: 199.9,
      promo: 169.9,
      stock: 8,
      cat: "Boosts de Servidor",
      featured: true,
      best: true,
      sold: 54,
      images: [img("boost3"), img("boost3b")],
    },
    {
      name: "Server Boost — Nível 2 (7 Boosts)",
      short: "Desbloqueie o nível 2 com 7 boosts garantidos.",
      desc:
        "Pacote de 7 boosts para atingir o Nível 2 do servidor. Áudio em 256kbps, 50 emojis, banner de servidor e uploads maiores para toda a comunidade.",
      price: 109.9,
      stock: 12,
      cat: "Boosts de Servidor",
      best: true,
      sold: 71,
      images: [img("boost2"), img("boost2b")],
    },
    {
      name: "Cargo VIP — Comunidade PlayBoy",
      short: "Acesso VIP exclusivo, canais fechados e sorteios.",
      desc:
        "Torne-se VIP na comunidade PlayBoy Store. Acesso a canais exclusivos, prioridade no suporte, participação em sorteios semanais e uma badge de destaque no servidor. Renovação mensal.",
      price: 24.9,
      promo: 19.9,
      stock: 100,
      cat: "Cargos & VIP",
      featured: true,
      sold: 205,
      images: [img("vip"), img("vipb")],
    },
    {
      name: "Cargo VIP+ — Anual",
      short: "Todos os benefícios VIP por 12 meses, com extras.",
      desc:
        "Plano anual do VIP+ com todos os benefícios do VIP mais acesso antecipado a novos produtos, cupons de desconto exclusivos e cargo personalizado com cor à sua escolha.",
      price: 149.9,
      stock: 30,
      cat: "Cargos & VIP",
      sold: 42,
      images: [img("vipplus")],
    },
    {
      name: "Bot de Moderação Premium",
      short: "Bot configurado e hospedado para seu servidor.",
      desc:
        "Configuração completa de um bot de moderação premium: auto-moderação, anti-raid, sistema de tickets, logs, boas-vindas personalizadas e comandos customizados. Inclui 30 dias de suporte.",
      price: 89.9,
      stock: 20,
      cat: "Bots & Automação",
      featured: true,
      sold: 38,
      images: [img("bot"), img("botb")],
    },
    {
      name: "Bot de Música 24/7",
      short: "Música sem anúncios, alta qualidade, sempre online.",
      desc:
        "Bot de música dedicado ao seu servidor, hospedado 24 horas por dia, sem anúncios, com filtros de áudio, playlists e qualidade premium.",
      price: 59.9,
      promo: 44.9,
      stock: 0,
      cat: "Bots & Automação",
      sold: 88,
      images: [img("music"), img("musicb")],
    },
    {
      name: "Setup Completo de Servidor",
      short: "Servidor profissional do zero, pronto para crescer.",
      desc:
        "Montagem completa e profissional do seu servidor Discord: categorias, canais, cargos, permissões, bots essenciais, regras, verificação e identidade visual. Entregamos tudo pronto para você começar.",
      price: 249.9,
      promo: 199.9,
      stock: 6,
      cat: "Serviços",
      featured: true,
      best: true,
      sold: 27,
      images: [img("setup"), img("setupb"), img("setupc")],
    },
    {
      name: "Design de Banner Animado",
      short: "Banner exclusivo e animado para seu servidor.",
      desc:
        "Criação de um banner animado exclusivo para o seu servidor, no estilo que você quiser. Entregamos os arquivos otimizados prontos para upload.",
      price: 69.9,
      stock: 25,
      cat: "Serviços",
      sold: 33,
      images: [img("banner")],
    },
    {
      name: "Gift Card PlayBoy — R$ 50",
      short: "Crédito para usar em qualquer produto da loja.",
      desc:
        "Gift card digital no valor de R$ 50 para usar em qualquer produto da PlayBoy Store. Perfeito para presentear alguém da comunidade.",
      price: 50.0,
      stock: 3,
      cat: "Gift Cards",
      sold: 61,
      images: [img("gift50")],
    },
    {
      name: "Gift Card PlayBoy — R$ 100",
      short: "Crédito de R$ 100 para a loja inteira.",
      desc:
        "Gift card digital no valor de R$ 100 para usar em qualquer produto da PlayBoy Store. Código entregue no Discord.",
      price: 100.0,
      stock: 4,
      cat: "Gift Cards",
      sold: 29,
      images: [img("gift100")],
    },
  ];

  const createdProducts: { id: string; name: string; price: number; promoPrice: number | null }[] = [];

  for (const p of products) {
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        shortDescription: p.short,
        description: p.desc,
        price: p.price,
        promoPrice: p.promo ?? null,
        stock: p.stock,
        soldCount: p.sold ?? 0,
        featured: p.featured ?? false,
        bestSeller: p.best ?? false,
        active: true,
        categoryId: categories[p.cat].id,
        images: {
          create: p.images.map((url, i) => ({ url, position: i })),
        },
      },
    });
    createdProducts.push({
      id: created.id,
      name: created.name,
      price: created.price,
      promoPrice: created.promoPrice,
    });
  }

  const priceOf = (p: { price: number; promoPrice: number | null }) =>
    p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price ? p.promoPrice : p.price;

  // ---- Open carts (for the admin "Carrinhos Abertos" area) ----
  const cart1 = await prisma.cart.create({
    data: {
      token: "seed-cart-marina",
      userId: customer2.id,
      status: "OPEN",
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            quantity: 1,
            unitPrice: priceOf(createdProducts[0]),
          },
          {
            productId: createdProducts[4].id,
            quantity: 2,
            unitPrice: priceOf(createdProducts[4]),
          },
        ],
      },
    },
  });

  await prisma.cart.create({
    data: {
      token: "seed-cart-guest",
      status: "OPEN",
      items: {
        create: [
          {
            productId: createdProducts[2].id,
            quantity: 1,
            unitPrice: priceOf(createdProducts[2]),
          },
        ],
      },
    },
  });

  // ---- A couple of historical orders / sales ----
  const paidItems = [
    { p: createdProducts[1], q: 1 },
    { p: createdProducts[6], q: 1 },
  ];
  const paidTotal = paidItems.reduce((s, i) => s + priceOf(i.p) * i.q, 0);
  await prisma.order.create({
    data: {
      code: "PB-10001",
      userId: customer.id,
      status: "PAID",
      total: paidTotal,
      deliveryMethod: "Discord",
      deliveryInfo: "Entregar via DM para lucas.f",
      items: {
        create: paidItems.map((i) => ({
          productId: i.p.id,
          name: i.p.name,
          quantity: i.q,
          unitPrice: priceOf(i.p),
        })),
      },
    },
  });

  const delItems = [{ p: createdProducts[3], q: 1 }];
  const delTotal = delItems.reduce((s, i) => s + priceOf(i.p) * i.q, 0);
  const deliveredOrder = await prisma.order.create({
    data: {
      code: "PB-10002",
      userId: customer.id,
      status: "DELIVERED",
      total: delTotal,
      deliveryMethod: "Discord",
      deliveryInfo: "Boosts aplicados no servidor da comunidade",
      items: {
        create: delItems.map((i) => ({
          productId: i.p.id,
          name: i.p.name,
          quantity: i.q,
          unitPrice: priceOf(i.p),
        })),
      },
    },
  });
  await prisma.delivery.create({
    data: {
      orderId: deliveredOrder.id,
      adminId: admin.id,
      manual: true,
      note: "Entrega manual de cortesia (parceria).",
      snapshot: JSON.stringify(delItems.map((i) => ({ name: i.p.name, quantity: i.q }))),
    },
  });

  await prisma.adminLog.createMany({
    data: [
      {
        adminId: admin.id,
        adminName: admin.name,
        action: "Entrega manual realizada",
        entityType: "Order",
        entityId: "PB-10002",
        detail: "Pedido PB-10002 entregue manualmente sem pagamento.",
      },
      {
        adminId: admin.id,
        adminName: admin.name,
        action: "Loja inicializada",
        entityType: "System",
        detail: "Catálogo inicial cadastrado com sucesso.",
      },
    ],
  });

  console.log("✅ Seed concluído.");
  console.log("   Admin:   admin@playboystore.com / admin123");
  console.log("   Cliente: cliente@playboystore.com / cliente123");
  console.log(`   Produtos: ${createdProducts.length} | Carrinhos abertos: 2`);
  void cart1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

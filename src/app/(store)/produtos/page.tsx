import type { Metadata } from "next";
import { getCatalogProducts, getCategoriesWithCount } from "@/lib/queries";
import { ProductCard } from "@/components/store/ProductCard";
import { CatalogControls } from "@/components/store/CatalogControls";
import { Reveal } from "@/components/ui/Reveal";
import { BoxIcon } from "@/components/ui/icons";
import type { ProductCardData } from "@/lib/types";

export const metadata: Metadata = { title: "Produtos" };
export const dynamic = "force-dynamic";

type SP = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function groupByCategory(products: ProductCardData[]) {
  const groups = new Map<string, ProductCardData[]>();
  for (const p of products) {
    const key = p.categoryName ?? "Outros";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return Array.from(groups.entries()).sort((a, b) => {
    if (a[0] === "Outros") return 1;
    if (b[0] === "Outros") return -1;
    return a[0].localeCompare(b[0], "pt-BR");
  });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const filter = str(searchParams.filter);
  const sortParam = str(searchParams.sort) as any;
  const disp = (str(searchParams.disp) as any) ?? "all";

  const sort =
    filter === "best"
      ? "best"
      : filter === "new"
        ? "recent"
        : sortParam ?? "recent";

  const [categories, products] = await Promise.all([
    getCategoriesWithCount(),
    getCatalogProducts({
      q: str(searchParams.q),
      category: str(searchParams.categoria),
      sort,
      availability: disp,
      min: str(searchParams.min) ? Number(str(searchParams.min)) : undefined,
      max: str(searchParams.max) ? Number(str(searchParams.max)) : undefined,
      featured: filter === "featured",
    }),
  ]);

  // Group by category unless a specific sort/search makes a flat list clearer.
  const isFiltered =
    !!str(searchParams.q) || sort === "price_asc" || sort === "price_desc";
  const grouped = groupByCategory(products);

  return (
    <div className="container-pb py-10 sm:py-14">
      <Reveal>
        <div className="mb-8">
          <p className="kicker">Catálogo completo</p>
          <h1 className="section-title mt-1.5">
            Catálogo <span className="text-ink-400">PlayBoy Store</span>
          </h1>
          <p className="mt-2 max-w-xl text-ink-400">
            Explore toda a nossa gama de produtos para elevar a sua experiência
            no Discord.
          </p>
        </div>
      </Reveal>

      <div className="card mb-10 p-4 sm:p-5">
        <CatalogControls categories={categories} total={products.length} />
      </div>

      {products.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-ink-800 text-ink-400">
            <BoxIcon className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-semibold text-white">
            Nenhum produto encontrado
          </h3>
          <p className="max-w-sm text-sm text-ink-400">
            Tente ajustar os filtros ou buscar por outro termo.
          </p>
        </div>
      ) : isFiltered ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 40, 240)}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {grouped.map(([name, items]) => (
            <section key={name}>
              <Reveal>
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="font-display text-xl font-bold text-white">
                    {name}
                  </h2>
                  <span className="rounded-full border border-white/10 bg-ink-850 px-2.5 py-0.5 text-xs text-ink-400">
                    {items.length}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.06]" />
                </div>
              </Reveal>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {items.map((p, i) => (
                  <Reveal key={p.id} delay={Math.min(i * 40, 200)}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

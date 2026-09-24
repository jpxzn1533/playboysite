"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { createProduct, updateProduct } from "@/app/admin/actions";
import { TrashIcon, PlusIcon } from "@/components/ui/icons";

type Category = { id: string; name: string };

export type VariantRow = {
  id?: string;
  name: string;
  price: string;
  promoPrice: string;
  stock: string;
};

export type ProductFormInitial = {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  featured: boolean;
  bestSeller: boolean;
  categoryId: string | null;
  images: string[];
  variants: {
    id: string;
    name: string;
    price: number;
    promoPrice: number | null;
    stock: number;
  }[];
};

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: ProductFormInitial;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [useVariants, setUseVariants] = useState(
    (initial?.variants?.length ?? 0) > 0
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: String(v.price),
      promoPrice: v.promoPrice != null ? String(v.promoPrice) : "",
      stock: String(v.stock),
    })) ?? []
  );

  function addVariant() {
    setVariants((vs) => [...vs, { name: "", price: "", promoPrice: "", stock: "0" }]);
  }
  function updateVariant(i: number, key: keyof VariantRow, value: string) {
    setVariants((vs) =>
      vs.map((v, idx) => (idx === i ? { ...v, [key]: value } : v))
    );
  }
  function removeVariant(i: number) {
    setVariants((vs) => vs.filter((_, idx) => idx !== i));
  }

  const serializedVariants = useVariants
    ? JSON.stringify(
        variants
          .filter((v) => v.name.trim() && Number(v.price) > 0)
          .map((v) => ({
            id: v.id,
            name: v.name.trim(),
            price: Number(v.price),
            promoPrice: v.promoPrice ? Number(v.promoPrice) : null,
            stock: Math.max(0, Math.round(Number(v.stock) || 0)),
            active: true,
          }))
      )
    : "[]";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (useVariants && variants.filter((v) => v.name.trim() && Number(v.price) > 0).length === 0) {
      toast("Adicione ao menos uma variação válida ou desative as variações.", "error");
      return;
    }
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = initial
      ? await updateProduct(initial.id, fd)
      : await createProduct(fd);
    setSaving(false);
    if (!res.ok) {
      toast(res.error ?? "Erro ao salvar.", "error");
      return;
    }
    toast(initial ? "Produto atualizado." : "Produto criado com sucesso.", "success");
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Main */}
      <div className="space-y-4">
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Informações</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Nome *</label>
              <input
                name="name"
                defaultValue={initial?.name}
                className="input"
                placeholder="Ex: Discord Nitro — 1 Mês"
                required
              />
            </div>
            <div>
              <label className="label">Descrição curta</label>
              <input
                name="shortDescription"
                defaultValue={initial?.shortDescription}
                className="input"
                placeholder="Resumo exibido nos cards"
              />
            </div>
            <div>
              <label className="label">Descrição completa</label>
              <textarea
                name="description"
                defaultValue={initial?.description}
                rows={6}
                className="input resize-none"
                placeholder="Detalhes completos do produto"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Imagens</h3>
          <label className="label">URLs das imagens (uma por linha)</label>
          <textarea
            name="images"
            defaultValue={initial?.images.join("\n")}
            rows={4}
            className="input resize-none font-mono text-xs"
            placeholder={"https://.../imagem1.png\nhttps://.../imagem2.png"}
          />
          <p className="mt-2 text-xs text-ink-400">
            A primeira imagem é usada como capa. Você pode colar vários links.
          </p>
        </div>

        {/* Variations */}
        <div className="card p-6">
          <input type="hidden" name="variants" value={serializedVariants} />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Variações</h3>
              <p className="mt-0.5 text-xs text-ink-400">
                Ex: durações, planos ou níveis com preço e estoque próprios.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-xs text-ink-300">Ativar</span>
              <span className="relative">
                <input
                  type="checkbox"
                  checked={useVariants}
                  onChange={(e) => {
                    setUseVariants(e.target.checked);
                    if (e.target.checked && variants.length === 0) addVariant();
                  }}
                  className="peer sr-only"
                />
                <span className="block h-6 w-11 rounded-full bg-ink-700 transition-colors peer-checked:bg-white" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-ink-300 transition-transform peer-checked:translate-x-5 peer-checked:bg-ink-950" />
              </span>
            </label>
          </div>

          {useVariants && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-white/[0.06] bg-ink-900/50 p-3 text-xs text-ink-400">
                Com variações ativas, o <strong className="text-ink-200">preço</strong> e o{" "}
                <strong className="text-ink-200">estoque</strong> exibidos na loja vêm de
                cada variação. O preço/estoque base acima servem apenas de referência.
              </div>

              {variants.map((v, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.06] bg-ink-850/60 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-300">
                      Variação {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="text-ink-400 hover:text-red-300"
                      aria-label="Remover variação"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={v.name}
                    onChange={(e) => updateVariant(i, "name", e.target.value)}
                    placeholder="Nome (ex: 1 Mês, 3 Meses, VIP Ouro)"
                    className="input mb-2"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase text-ink-500">
                        Preço
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.price}
                        onChange={(e) => updateVariant(i, "price", e.target.value)}
                        placeholder="0,00"
                        className="input py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase text-ink-500">
                        Promo
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.promoPrice}
                        onChange={(e) =>
                          updateVariant(i, "promoPrice", e.target.value)
                        }
                        placeholder="—"
                        className="input py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase text-ink-500">
                        Estoque
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateVariant(i, "stock", e.target.value)}
                        placeholder="0"
                        className="input py-2"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariant}
                className="btn-secondary w-full"
              >
                <PlusIcon className="h-4 w-4" /> Adicionar variação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Preço</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Preço (R$) *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initial?.price}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Preço promocional (R$)</label>
              <input
                name="promoPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initial?.promoPrice ?? ""}
                className="input"
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Estoque & categoria</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Estoque</label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={initial?.stock ?? 0}
                className="input"
              />
            </div>
            <div>
              <label className="label">Alerta de estoque baixo</label>
              <input
                name="lowStockThreshold"
                type="number"
                min="1"
                defaultValue={initial?.lowStockThreshold ?? 5}
                className="input"
              />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select
                name="categoryId"
                defaultValue={initial?.categoryId ?? ""}
                className="input"
              >
                <option value="" className="bg-ink-800">
                  Sem categoria
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-ink-800">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Visibilidade</h3>
          <div className="space-y-3">
            <Toggle name="active" label="Produto ativo" defaultChecked={initial?.active ?? true} />
            <Toggle name="featured" label="Destaque" defaultChecked={initial?.featured ?? false} />
            <Toggle name="bestSeller" label="Mais vendido" defaultChecked={initial?.bestSeller ?? false} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? "Salvando..." : initial ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-ink-200">{label}</span>
      <span className="relative">
        <input
          type="checkbox"
          name={name}
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
          className="peer sr-only"
        />
        <span className="block h-6 w-11 rounded-full bg-ink-700 transition-colors peer-checked:bg-white" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-ink-300 transition-transform peer-checked:translate-x-5 peer-checked:bg-ink-950" />
      </span>
    </label>
  );
}

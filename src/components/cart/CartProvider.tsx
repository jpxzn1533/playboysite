"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/Toast";

export type CartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
};

type CartState = {
  items: CartItem[];
  count: number;
  subtotal: number;
  total: number;
  loading: boolean;
  busy: boolean;
  refresh: () => Promise<void>;
  add: (
    productId: string,
    quantity?: number,
    variantId?: string | null
  ) => Promise<boolean>;
  setQty: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const applyData = useCallback((data: { items: CartItem[] }) => {
    setItems(data.items ?? []);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) applyData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [applyData]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId: string, quantity = 1, variantId: string | null = null) => {
      setBusy(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity, variantId }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast(data.error ?? "Não foi possível adicionar o produto.", "error");
          return false;
        }
        applyData(data);
        toast("Produto adicionado ao carrinho.", "success");
        return true;
      } catch {
        toast("Erro de conexão. Tente novamente.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [applyData, toast]
  );

  const setQty = useCallback(
    async (itemId: string, quantity: number) => {
      setBusy(true);
      try {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast(data.error ?? "Não foi possível atualizar.", "error");
          return;
        }
        applyData(data);
      } catch {
        toast("Erro de conexão. Tente novamente.", "error");
      } finally {
        setBusy(false);
      }
    },
    [applyData, toast]
  );

  const remove = useCallback(
    async (itemId: string) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/cart?itemId=${itemId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok) {
          applyData(data);
          toast("Produto removido do carrinho.", "info");
        }
      } catch {
        toast("Erro de conexão. Tente novamente.", "error");
      } finally {
        setBusy(false);
      }
    },
    [applyData, toast]
  );

  const clear = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        total: subtotal,
        loading,
        busy,
        refresh,
        add,
        setQty,
        remove,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

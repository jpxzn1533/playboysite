export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return formatDate(d);
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function effectivePrice(product: {
  price: number;
  promoPrice?: number | null;
}): number {
  if (product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price) {
    return product.promoPrice;
  }
  return product.price;
}

export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    CART_OPEN: "Carrinho aberto",
    AWAITING_PAYMENT: "Aguardando pagamento",
    PAID: "Pago",
    PREPARING: "Em preparação",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

export function cartStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: "Aberto",
    CONVERTED: "Convertido",
    ABANDONED: "Abandonado",
  };
  return map[status] ?? status;
}

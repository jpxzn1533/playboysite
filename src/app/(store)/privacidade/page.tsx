import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <div className="container-pb max-w-3xl py-14">
      <h1 className="section-title">Política de privacidade</h1>
      <div className="mt-6 space-y-4 text-ink-300 leading-relaxed">
        <p>
          Respeitamos a sua privacidade. Coletamos apenas os dados necessários
          para processar pedidos e realizar entregas, como nome, e-mail e usuário
          do Discord.
        </p>
        <p>
          Seus dados não são compartilhados com terceiros para fins de marketing.
          Utilizamos cookies essenciais para manter sua sessão e o carrinho de
          compras.
        </p>
        <p>
          Este é um projeto de demonstração. Substitua este conteúdo pela política
          oficial da sua loja antes de publicar em produção.
        </p>
      </div>
    </div>
  );
}

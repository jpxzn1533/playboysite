import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <div className="container-pb max-w-3xl py-14">
      <h1 className="section-title">Termos de uso</h1>
      <div className="mt-6 space-y-4 text-ink-300 leading-relaxed">
        <p>
          Ao utilizar a PlayBoy Store você concorda com estes termos. Nossos
          produtos são digitais e destinados ao uso na plataforma Discord.
        </p>
        <p>
          As entregas são realizadas diretamente no Discord após a confirmação do
          pedido. Prazos podem variar conforme o produto e a disponibilidade da
          equipe.
        </p>
        <p>
          Este é um projeto de demonstração. Substitua este conteúdo pelos termos
          oficiais da sua loja antes de publicar em produção.
        </p>
      </div>
    </div>
  );
}

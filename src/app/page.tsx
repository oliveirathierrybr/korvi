import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeftRight,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  Tags,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { BrandMesh } from "@/components/brand-mesh";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Korvi | Gestão financeira inteligente para pequenas empresas",
  description:
    "Controle de caixa, contas a pagar e a receber e relatórios financeiros em um só lugar. Simples, moderno e feito para pequenas empresas.",
};

const bars = [38, 62, 45, 78, 55, 90];

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard completo",
    description:
      "Saldo, entradas, saídas e fluxo de caixa dos últimos meses num único painel, atualizado em tempo real.",
  },
  {
    icon: ArrowLeftRight,
    title: "Caixa organizado",
    description:
      "Registre entradas e saídas por categoria e filtre por período sempre que precisar entender pra onde o dinheiro foi.",
  },
  {
    icon: ArrowUpCircle,
    title: "Contas a pagar",
    description:
      "Nunca mais perca um vencimento. Ao quitar uma conta, o lançamento entra sozinho no caixa.",
  },
  {
    icon: ArrowDownCircle,
    title: "Contas a receber",
    description:
      "Acompanhe o que ainda vai entrar e confirme recebimentos com um clique, sem retrabalho.",
  },
  {
    icon: BarChart3,
    title: "Relatórios claros",
    description:
      "Comparativos mensais e por categoria, prontos para exportar em CSV quando precisar analisar fora do sistema.",
  },
  {
    icon: Tags,
    title: "Categorias sob medida",
    description:
      "Organize entradas e saídas do jeito que faz sentido para o seu negócio, sem modelos engessados.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crie a conta da sua empresa",
    description: "Leva menos de um minuto, sem cartão de crédito.",
  },
  {
    number: "02",
    title: "Cadastre seus lançamentos",
    description: "Entradas, saídas e contas a pagar e a receber.",
  },
  {
    number: "03",
    title: "Acompanhe tudo em um painel",
    description: "Números confiáveis para decidir com rapidez.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={26} wordmarkClassName="text-lg" />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button nativeButton={false} render={<Link href="/cadastro" />}>
              Criar conta grátis
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrandMesh />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                Feito para pequenas empresas
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-balance sm:text-5xl">
                O caixa da sua empresa, sob controle total.
              </h1>
              <p className="max-w-md text-base text-white/75">
                Entradas, saídas, contas a pagar e a receber em um único
                painel. Sem planilha, sem confusão — só os números que
                importam para decidir rápido.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="lg"
                  className="h-11 rounded-lg bg-white px-6 text-[#0d2b4e] hover:bg-white/90"
                  nativeButton={false}
                  render={<Link href="/cadastro" />}
                >
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-lg border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Já tenho conta
                </Button>
              </div>
            </div>

            {/* card flutuante com prévia do produto */}
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/70">Saldo atual</p>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#01ad8c]/25 px-1.5 py-0.5 text-[10px] font-medium text-[#5eead4]">
                  <ArrowUpRight className="h-3 w-3" />
                  12%
                </span>
              </div>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
                R$ 24.850,00
              </p>
              <div className="mt-5 flex h-16 items-end gap-1.5">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-[#01ad8c] to-[#5eead4]"
                    style={{ height: `${h}%`, opacity: 0.5 + i * 0.08 }}
                  />
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[11px] text-white/60">Entradas do mês</p>
                  <p className="text-sm font-semibold text-white">
                    R$ 18.200,00
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/60">Saídas do mês</p>
                  <p className="text-sm font-semibold text-white">
                    R$ 9.450,00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Tudo que a sua empresa precisa para não se perder no caixa
            </h2>
            <p className="mt-3 text-muted-foreground">
              Um painel objetivo, sem funções que você nunca vai usar.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-medium">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Comece a usar em três passos
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center sm:text-left">
                  <span className="text-sm font-semibold text-primary">
                    {step.number}
                  </span>
                  <h3 className="mt-2 font-medium">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden">
          <BrandMesh />
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center text-white sm:px-6">
            <h2 className="text-3xl font-semibold text-balance">
              Pronto para tirar as finanças da planilha?
            </h2>
            <p className="mt-3 text-white/75">
              Crie a conta da sua empresa gratuitamente e comece a usar hoje
              mesmo.
            </p>
            <Button
              size="lg"
              className="mt-8 h-11 rounded-lg bg-white px-6 text-[#0d2b4e] hover:bg-white/90"
              nativeButton={false}
              render={<Link href="/cadastro" />}
            >
              Criar conta grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Logo size={22} wordmarkClassName="text-sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Korvi. Gestão financeira
            inteligente para pequenas empresas.
          </p>
        </div>
      </footer>
    </div>
  );
}

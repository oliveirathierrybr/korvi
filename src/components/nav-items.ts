import {
  LayoutDashboard,
  ArrowLeftRight,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  Tags,
  Bot,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contas-bancarias", label: "Contas bancárias", icon: Landmark },
  { href: "/caixa", label: "Caixa", icon: ArrowLeftRight },
  { href: "/contas-a-pagar", label: "Contas a Pagar", icon: ArrowUpCircle },
  {
    href: "/contas-a-receber",
    label: "Contas a Receber",
    icon: ArrowDownCircle,
  },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/assistente", label: "Assistente IA", icon: Bot },
];

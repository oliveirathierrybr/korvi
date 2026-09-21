import type { NextConfig } from "next";

// Cabeçalhos de segurança HTTP aplicados a toda resposta. Next.js 16 não
// define nenhum por padrão — sem isso, o app fica sem proteção básica contra
// clickjacking, MIME-sniffing e vazamento de referrer entre origens.
const securityHeaders = [
  // Impede que o app seja embutido em <iframe> de outro site (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Impede que o navegador tente "adivinhar" um Content-Type diferente do
  // declarado (vetor clássico de XSS via upload/servir arquivo).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Só envia a origem (não o path/query completo) como Referer em navegação
  // cross-origin — evita vazar tokens/IDs que às vezes acabam na URL.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs sensíveis de browser que o app não usa.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // CSP no padrão que o próprio Next.js recomenda quando não se usa nonce
  // (ver node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md,
  // seção "Without Nonces"): 'unsafe-inline' em script-src fica porque
  // next-themes injeta um <script> inline para aplicar o tema antes do
  // primeiro paint (evita flash claro/escuro) e um nonce por requisição
  // forçaria toda página do app a renderização dinâmica — troca que não
  // faz sentido aqui. 'unsafe-inline' em style-src é necessário de verdade:
  // várias telas (Caixa, Contas, fila de conciliação) usam `style={{...}}`
  // para pintar a cor de cada categoria, o que o React resolve como atributo
  // `style` inline — CSP não tem como liberar isso via nonce. Ainda assim,
  // restringir default-src/frame-ancestors/object-src/base-uri já barra a
  // maior parte dos vetores de terceiro (scripts/frames/objetos de outra
  // origem, submissão de formulário para fora do site).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Não anuncia "roda em Next.js" via header X-Powered-By.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

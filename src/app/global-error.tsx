"use client";

// global-error substitui o layout raiz inteiro quando ativo, então não tem
// acesso ao globals.css/ThemeProvider — por isso o estilo aqui é inline e
// não depende de Tailwind nem de tema (ver node_modules/next/dist/docs/
// 01-app/03-api-reference/03-file-conventions/error.md).
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#fff",
          color: "#141413",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          Algo deu errado
        </h2>
        <p style={{ maxWidth: 360, fontSize: 14, color: "#666", margin: 0 }}>
          Não foi possível carregar a aplicação. Tente novamente em instantes.
        </p>
        <button
          onClick={() => unstable_retry()}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#141413",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}

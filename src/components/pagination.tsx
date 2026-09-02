import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Paginação simples renderizada no servidor (sem JS no cliente) — os links
 * são âncoras normais que trocam o parâmetro `page` da URL, então funcionam
 * junto com os filtros existentes (que já vivem na querystring) sem precisar
 * de estado local.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          nativeButton={false}
          render={<a href={buildHref(Math.max(1, page - 1))} />}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          nativeButton={false}
          render={<a href={buildHref(Math.min(totalPages, page + 1))} />}
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

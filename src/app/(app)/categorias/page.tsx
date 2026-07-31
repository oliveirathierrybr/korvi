import { prisma } from "@/lib/prisma";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { DeleteCategoryButton } from "@/components/categories/delete-category-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";

export default async function CategoriasPage() {
  const userId = await requireUserId();
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const entradas = categories.filter((c) => c.type === "ENTRADA");
  const saidas = categories.filter((c) => c.type === "SAIDA");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize entradas e saídas para relatórios mais claros.
          </p>
        </div>
        <CategoryDialog />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryGroup title="Entradas" categories={entradas} />
        <CategoryGroup title="Saídas" categories={saidas} />
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
}: {
  title: string;
  categories: { id: string; name: string; color: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria cadastrada.
          </p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm">{category.name}</span>
              </div>
              <DeleteCategoryButton id={category.id} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

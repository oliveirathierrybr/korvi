import { BillsPageContent } from "@/components/bills/bills-page-content";

export default async function ContasAReceberPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return <BillsPageContent direction="RECEBER" searchParams={await searchParams} />;
}

import { BillsPageContent } from "@/components/bills/bills-page-content";

export default async function ContasAPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return <BillsPageContent direction="PAGAR" searchParams={await searchParams} />;
}

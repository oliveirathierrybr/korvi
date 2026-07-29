import { BrandMesh } from "@/components/brand-mesh";

export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-8">
      <BrandMesh />
      <div className="relative w-full">{children}</div>
    </div>
  );
}

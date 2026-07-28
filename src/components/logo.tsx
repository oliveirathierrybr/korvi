import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  size = 24,
  wordmarkClassName,
  className,
}: {
  size?: number;
  wordmarkClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/icon-mark.png"
        alt=""
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
      <span className={cn("font-semibold tracking-tight", wordmarkClassName)}>
        Korvi
      </span>
    </span>
  );
}

import { Logo } from "@/components/logo";

export function AuthCard({
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-sm",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className={`mx-auto w-full ${maxWidth}`}>
      <div className="rounded-2xl bg-card/95 p-6 shadow-2xl shadow-black/30 ring-1 ring-black/5 backdrop-blur-xl sm:p-8 dark:ring-white/10">
        <div className="mb-6 space-y-2 text-center">
          <div className="mb-3 flex items-center justify-center">
            <Logo size={30} wordmarkClassName="text-lg" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
      {footer ? (
        <p className="mt-6 text-center text-sm text-white/80">{footer}</p>
      ) : null}
    </div>
  );
}

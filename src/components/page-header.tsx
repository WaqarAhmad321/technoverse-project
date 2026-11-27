import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  children?: React.ReactNode;
};

// The top of every screen: an optional way back, one title, one line under it, and the main action at the right.
export function PageHeader({ title, description, back, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-6">
      {back && (
        <Link
          href={back.href}
          className="group -ml-2 flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted-foreground transition-colors duration-200 ease-out hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ArrowLeft aria-hidden className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
          {description && <p className="text-base text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

// The top of every screen: one title, one line under it, and the screen's main action at the right.
export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
        {description && <p className="text-base text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

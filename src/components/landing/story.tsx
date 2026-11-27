import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StoryProps = {
  title: string;
  incident: string;
  source: string;
  sourceHref: string;
  children: ReactNode;
  fragment: ReactNode;
  flip?: boolean;
};

// One pillar: a real incident, what we do about it, and the interface that does it.
export function Story({ title, incident, source, sourceHref, children, fragment, flip }: StoryProps) {
  return (
    <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className={cn("flex flex-col gap-5", flip && "lg:order-2")}>
        <h2 className="text-3xl font-medium tracking-tight text-balance">{title}</h2>
        <blockquote className="border-l-2 border-primary pl-4">
          <p className="text-lg leading-7">{incident}</p>
          <footer className="mt-1 text-sm text-muted-foreground">
            <a href={sourceHref} target="_blank" rel="noreferrer" className="rounded-sm underline underline-offset-4 hover:text-foreground">
              {source}
            </a>
          </footer>
        </blockquote>
        <div className="flex flex-col gap-3 text-base leading-6 text-muted-foreground">{children}</div>
      </div>
      <div className={cn(flip && "lg:order-1")}>{fragment}</div>
    </section>
  );
}

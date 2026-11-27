import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

type Tone = "error" | "done";

const toneStyles: Record<Tone, string> = {
  error: "text-destructive",
  done: "text-foreground",
};

export function FormMessage({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const Icon = tone === "error" ? CircleAlertIcon : CircleCheckIcon;

  return (
    <p role={tone === "error" ? "alert" : "status"} className={`flex items-center gap-2 text-base ${toneStyles[tone]}`}>
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

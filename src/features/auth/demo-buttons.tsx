import { SubmitButton } from "@/components/submit-button";
import { signInAsDemo } from "./actions";

const MAIN_ROLES = [
  { role: "examiner", label: "Try as examiner" },
  { role: "candidate", label: "Try as candidate" },
  { role: "admin", label: "Try as admin" },
] as const;

// One form per button, so each carries its own role and a second click on one waits for it.
export function DemoButtons() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {MAIN_ROLES.map(({ role, label }, index) => (
          <form key={role} action={signInAsDemo}>
            <input type="hidden" name="role" value={role} />
            <SubmitButton size="lg" variant={index === 0 ? "default" : "outline"}>
              {label}
            </SubmitButton>
          </form>
        ))}
      </div>
      <form action={signInAsDemo}>
        <input type="hidden" name="role" value="platform" />
        <SubmitButton size="lg" variant="link" className="px-0">
          Platform admin
        </SubmitButton>
      </form>
    </div>
  );
}

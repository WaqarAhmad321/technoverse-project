export function SetupNotice({ problems }: { problems: string[] }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold tracking-tight">This app is not connected yet</h1>
      <p className="text-base text-muted-foreground">
        Fix these settings in .env.local as SETUP.md describes, then restart the app.
      </p>
      <ul className="list-disc pl-6 text-base">
        {problems.map((problem) => (
          <li key={problem}>{problem}</li>
        ))}
      </ul>
    </main>
  );
}

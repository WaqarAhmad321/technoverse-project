import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { plural, selectClass } from "../format";
import type { BankFilters, BankRow } from "./data";
import { DIFFICULTIES, DIFFICULTY_LABEL, KINDS, KIND_LABEL, firstLine } from "./schema";

export function BankFiltersForm({ filters, topics }: { filters: BankFilters; topics: string[] }) {
  return (
    <form method="get" className="grid gap-2 pb-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
      <label className="relative">
        <span className="sr-only">Search questions</span>
        <Search className="pointer-events-none absolute top-3 left-4 size-5 text-muted-foreground" aria-hidden />
        <Input name="q" defaultValue={filters.q ?? ""} placeholder="Search by text" className="h-11 rounded-full pl-11" />
      </label>
      <select name="topic" defaultValue={filters.topic ?? ""} className={selectClass} aria-label="Topic">
        <option value="">All topics</option>
        {topics.map((topic) => (
          <option key={topic}>{topic}</option>
        ))}
      </select>
      <select name="difficulty" defaultValue={filters.difficulty ?? ""} className={selectClass} aria-label="Difficulty">
        <option value="">Any difficulty</option>
        {DIFFICULTIES.map((value) => (
          <option key={value} value={value}>
            {DIFFICULTY_LABEL[value]}
          </option>
        ))}
      </select>
      <select name="kind" defaultValue={filters.kind ?? ""} className={selectClass} aria-label="Kind">
        <option value="">Any kind</option>
        {KINDS.map((value) => (
          <option key={value} value={value}>
            {KIND_LABEL[value]}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary" size="lg">
        Filter
      </Button>
    </form>
  );
}

export function BankList({ rows, highlightId, isFiltered }: { rows: BankRow[]; highlightId?: string; isFiltered: boolean }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        message={isFiltered ? "No questions match these filters." : "Your bank is empty. Add your first question to start setting exams."}
        action={
          <Button asChild variant="outline" size="lg">
            <Link href={isFiltered ? "/questions" : "/questions/new"}>{isFiltered ? "Clear filters" : "Add question"}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-3xl bg-card p-2 md:p-4">
      <div className="hidden grid-cols-[1fr_8rem_6rem_8rem_4rem_7rem] gap-3 px-3 pb-2 text-sm text-muted-foreground md:grid">
        <span>Question</span>
        <span>Topic</span>
        <span>Difficulty</span>
        <span>Kind</span>
        <span className="text-right">Marks</span>
        <span className="text-right">Used in</span>
      </div>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.id} className="border-b border-border last:border-0">
            <Link
              href={`/questions/${row.id}`}
              className={`grid gap-1 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-accent md:min-h-14 md:grid-cols-[1fr_8rem_6rem_8rem_4rem_7rem] md:items-center md:gap-3 ${row.id === highlightId ? "bg-primary/10" : ""}`}
            >
              <span className="line-clamp-2 text-base">{firstLine(row.body)}</span>
              <span className="text-sm text-muted-foreground md:text-base md:text-foreground">
                <span className="md:hidden">
                  {row.topic} · {DIFFICULTY_LABEL[row.difficulty]} · {KIND_LABEL[row.kind]} · {plural(row.marks, "mark")} · in{" "}
                  {plural(row.examTitles.length, "exam")}
                </span>
                <span className="hidden md:inline">{row.topic}</span>
              </span>
              <span className="hidden md:inline">{DIFFICULTY_LABEL[row.difficulty]}</span>
              <span className="hidden md:inline">{KIND_LABEL[row.kind]}</span>
              <span className="hidden text-right tabular-nums md:inline">{row.marks}</span>
              <span className="hidden text-right text-muted-foreground md:inline">{plural(row.examTitles.length, "exam")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

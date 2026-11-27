import { BarList } from "@/components/charts/bar-list";
import { ChartCard } from "@/components/charts/chart-card";
import { Histogram } from "@/components/charts/histogram";
import { ScoreTrend } from "@/components/charts/score-trend";
import type { CandidateCharts, ExaminerCharts, PlatformCharts, StaffCharts } from "@/lib/dashboard-data";

const grid = "grid gap-4 lg:grid-cols-2";

export function ExaminerChartsSection({ data }: { data: ExaminerCharts }) {
  const { distribution, hardest, marking } = data;
  const markingTotal = marking ? marking.marked + marking.toMark : 0;
  return (
    <section aria-label="Exam insights" className={grid}>
      <ChartCard
        title="How did the latest exam go?"
        note={distribution ? `${distribution.exam}: ${distribution.passed} of ${distribution.total} candidates passed` : undefined}
        empty={distribution ? undefined : "Scores appear here once a closed exam has submitted attempts."}
      >
        {distribution && <Histogram bins={distribution.bins} />}
      </ChartCard>
      <ChartCard
        title="Which questions were hardest?"
        note={hardest ? `Share of marks earned, lowest first. ${hardest.exam}` : undefined}
        empty={hardest ? undefined : "Question difficulty appears once answers are marked."}
      >
        {hardest && <BarList bars={hardest.bars} max={100} suffix="%" />}
      </ChartCard>
      <ChartCard
        title="How much written marking is left?"
        empty={marking ? undefined : "No written answers to mark right now."}
      >
        {marking && (
          <BarList
            max={markingTotal}
            bars={[
              { label: "Marked", value: marking.marked },
              { label: "Still to mark", value: marking.toMark },
            ]}
          />
        )}
      </ChartCard>
    </section>
  );
}

export function CandidateChartsSection({ data }: { data: CandidateCharts }) {
  return (
    <section aria-label="Your progress" className={grid}>
      <ChartCard title="Am I improving?" note="Each published result against the class average" empty={data.scores.length === 0 ? "Your scores appear here after your first result is published." : undefined}>
        {data.scores.length > 0 && <ScoreTrend points={data.scores} />}
      </ChartCard>
      <ChartCard title="Which topics am I strongest in?" note="Share of marks earned, across your results" empty={data.topics.length === 0 ? "Topic strengths appear once you have a marked result." : undefined}>
        {data.topics.length > 0 && <BarList bars={data.topics} max={100} suffix="%" highlightBelow={50} />}
      </ChartCard>
    </section>
  );
}

export function StaffChartsSection({ data }: { data: StaffCharts }) {
  const waiting = data.approvals ? data.approvals.paper + data.approvals.results : 0;
  return (
    <section aria-label="Institution activity" className={grid}>
      <ChartCard title="Where are our exams right now?" empty={data.states.length === 0 ? "Create an exam to see its stage here." : undefined}>
        {data.states.length > 0 && <BarList bars={data.states} />}
      </ChartCard>
      <ChartCard title="How many passed each exam?" note="Share of candidates at or above 33%" empty={data.passRates.length === 0 ? "Pass rates appear once a closed exam has results." : undefined}>
        {data.passRates.length > 0 && <BarList bars={data.passRates} max={100} suffix="%" />}
      </ChartCard>
      {data.approvals && (
        <ChartCard title="What is waiting for sign-off?" empty={waiting === 0 ? "Nothing is waiting for approval." : undefined}>
          {waiting > 0 && (
            <BarList
              bars={[
                { label: "Papers to approve", value: data.approvals.paper },
                { label: "Results to approve", value: data.approvals.results },
              ]}
            />
          )}
        </ChartCard>
      )}
    </section>
  );
}

export function PlatformChartsSection({ data }: { data: PlatformCharts }) {
  const people = data.perInstitution.map((row) => ({ label: row.name, value: row.people, detail: `${row.exams} ${row.exams === 1 ? "exam" : "exams"}` }));
  return (
    <section aria-label="Platform activity" className={grid}>
      <ChartCard title="How many institutions are live?" empty={data.statuses.length === 0 ? "Institutions appear here once they sign up." : undefined}>
        {data.statuses.length > 0 && <BarList bars={data.statuses} />}
      </ChartCard>
      <ChartCard title="Where is the activity?" note="People on each institution, with its exams" empty={people.length === 0 ? "No institutions yet." : undefined}>
        {people.length > 0 && <BarList bars={people} />}
      </ChartCard>
    </section>
  );
}

import type { AnswerKey } from "@/lib/exam-types";

type RecordedDraft = { body: string; options: string[]; correct: AnswerKey };

// Recorded answers for demo mode and the check, written for questions in the seeded Physics bank.
// Matched by the start of the original question; any other question gets none in demo mode.
const RECORDED: { startsWith: string; variants: RecordedDraft[] }[] = [
  {
    startsWith: "A ball is dropped from rest",
    variants: [
      { body: "A mango falls from a tree in a Multan orchard and reaches the ground after 2 s. Taking g = 10 m/s², how high was it?", options: ["10 m", "20 m", "40 m", "5 m"], correct: ["b"] },
      { body: "A stone dropped into a well in Swat hits the water after 4 s. Taking g = 10 m/s² and ignoring air, how far down is the water?", options: ["40 m", "160 m", "80 m", "20 m"], correct: ["c"] },
      { body: "A phone slips from a balcony and falls freely for 1.5 s (g = 10 m/s²). How far does it drop?", options: ["7.5 m", "15 m", "22.5 m", "11.25 m"], correct: ["d"] },
      { body: "A raindrop falls from rest for 5 s before air resistance matters (g = 10 m/s²). How far has it fallen?", options: ["125 m", "50 m", "250 m", "25 m"], correct: ["a"] },
    ],
  },
  {
    startsWith: "A train speeds up evenly",
    variants: [
      { body: "A Metro bus in Lahore speeds up evenly from 5 m/s to 17 m/s in 4 s. What is its acceleration?", options: ["4.25 m/s²", "3 m/s²", "1.5 m/s²", "2 m/s²"], correct: ["b"] },
      { body: "A rickshaw on Mall Road goes from rest to 12 m/s in 6 s at a steady rate. What is its acceleration?", options: ["72 m/s²", "0.5 m/s²", "6 m/s²", "2 m/s²"], correct: ["d"] },
      { body: "A cricket ball goes from rest to 36 m/s in 0.2 s as it is bowled. What is its average acceleration?", options: ["7.2 m/s²", "180 m/s²", "36 m/s²", "18 m/s²"], correct: ["b"] },
      { body: "A motorbike slows evenly from 20 m/s to 8 m/s in 3 s. What is the size of its deceleration?", options: ["4 m/s²", "9.3 m/s²", "2.7 m/s²", "12 m/s²"], correct: ["a"] },
    ],
  },
  {
    startsWith: "A 1,200 kg car accelerates",
    variants: [
      { body: "A 900 kg Suzuki Mehran speeds up at 3 m/s². What net force acts on it?", options: ["300 N", "2,700 N", "900 N", "1,800 N"], correct: ["b"] },
      { body: "A cyclist and bicycle of total mass 60 kg accelerate at 1.5 m/s². What net force acts on them?", options: ["40 N", "61.5 N", "90 N", "900 N"], correct: ["c"] },
      { body: "A loaded 2,000 kg Bedford truck accelerates at 0.5 m/s² on the GT Road. What net force acts on it?", options: ["1,000 N", "4,000 N", "2,000.5 N", "500 N"], correct: ["a"] },
      { body: "A 0.15 kg cricket ball is given an acceleration of 400 m/s² by the bat. What average net force acts on it?", options: ["600 N", "6 N", "2,667 N", "60 N"], correct: ["d"] },
    ],
  },
];

export function recordedVariants(originalBody: string): RecordedDraft[] {
  return RECORDED.find((entry) => originalBody.startsWith(entry.startsWith))?.variants ?? [];
}

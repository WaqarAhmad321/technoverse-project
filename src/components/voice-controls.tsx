"use client";

import { Mic, MicOff, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

// Browser speech only: nothing leaves the candidate's device except through the browser's own recogniser.
type VoiceOption = { id: string; text: string };

type VoiceControlsProps = {
  position: number;
  body: string;
  kind: "single" | "multiple" | "written";
  options: VoiceOption[];
  textareaId?: string;
  onChoose: (optionId: string) => void;
  onDictate: (text: string) => void;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

const SPEECH_LANG = "en-PK";
const LETTERS = "abcdefgh";
// What recognisers commonly hear when someone says a letter.
const SPOKEN_LETTERS: Record<string, string> = { a: "a", ay: "a", eh: "a", b: "b", bee: "b", be: "b", c: "c", see: "c", sea: "c", d: "d", dee: "d", e: "e", f: "f", ef: "f" };

function recognitionClass(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function noSubscription(): () => void {
  return () => {};
}

function speak(text: string): void {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LANG;
  window.speechSynthesis.speak(utterance);
}

function spokenQuestion({ position, body, kind, options }: Pick<VoiceControlsProps, "position" | "body" | "kind" | "options">): string {
  const lines = options.map((option, index) => `Option ${LETTERS[index]?.toUpperCase()}: ${option.text}.`);
  const howTo = kind === "written" ? "Press Alt V and speak your answer." : "Press Alt V and say the option letter, for example: option B.";
  return [`Question ${position}.`, body, ...lines, howTo].join(" ");
}

// "option b", "b", "bee" → the option id at that letter.
export function optionFromSpeech(transcript: string, options: VoiceOption[]): string | null {
  const words = transcript.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  for (const word of [...words].reverse()) {
    const letter = SPOKEN_LETTERS[word];
    const index = letter ? LETTERS.indexOf(letter) : -1;
    if (index >= 0 && index < options.length) return options[index].id;
  }
  return null;
}

export function VoiceControls(props: VoiceControlsProps) {
  const { kind, options, textareaId, onChoose, onDictate } = props;
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("");
  const canListen = useSyncExternalStore(noSubscription, () => recognitionClass() !== null, () => false);
  const recognition = useRef<Recognition | null>(null);

  function readAloud() {
    if (!("speechSynthesis" in window)) return setStatus("This browser cannot read aloud.");
    speak(spokenQuestion(props));
  }

  function handleFinal(transcript: string) {
    if (kind === "written") {
      const area = textareaId ? (document.getElementById(textareaId) as HTMLTextAreaElement | null) : null;
      const next = `${area?.value ? `${area.value} ` : ""}${transcript.trim()}`;
      if (area) area.value = next;
      onDictate(next);
      setStatus(`Added: ${transcript.trim()}`);
      return;
    }
    const optionId = optionFromSpeech(transcript, options);
    if (!optionId) {
      setStatus(`Heard "${transcript}". Say a letter, for example: option B.`);
      speak("Sorry, say the option letter again.");
      return;
    }
    const letter = LETTERS[options.findIndex((option) => option.id === optionId)]?.toUpperCase();
    onChoose(optionId);
    setStatus(`Chose option ${letter}.`);
    speak(`Option ${letter} chosen.`);
  }

  function toggleListening() {
    if (isListening) {
      recognition.current?.stop();
      return;
    }
    const Recogniser = recognitionClass();
    if (!Recogniser) return setStatus("Voice answers need Chrome or Edge.");
    const next = new Recogniser();
    next.lang = SPEECH_LANG;
    next.continuous = kind === "written";
    next.interimResults = false;
    next.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) handleFinal(result[0]?.transcript ?? "");
      }
    };
    next.onend = () => setIsListening(false);
    next.onerror = (event) => setStatus(event.error === "not-allowed" ? "Allow the microphone to answer by voice." : "Could not hear that. Try again.");
    recognition.current = next;
    next.start();
    setIsListening(true);
    setStatus(kind === "written" ? "Listening. Speak your answer, then press Alt V to stop." : "Listening for an option letter.");
  }

  useEffect(() => () => recognition.current?.stop(), []);

  return (
    <div className="mt-3 flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        <Button type="button" variant="ghost" className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground" onClick={readAloud} aria-keyshortcuts="Alt+R" data-voice="read">
          <Volume2 aria-hidden className="size-4" />
          Read aloud
        </Button>
        {canListen && (
          <Button type="button" variant={isListening ? "secondary" : "ghost"} className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground" onClick={toggleListening} aria-pressed={isListening} aria-keyshortcuts="Alt+V" data-voice="listen">
            {isListening ? <MicOff aria-hidden className="size-4" /> : <Mic aria-hidden className="size-4" />}
            {isListening ? "Stop listening" : kind === "written" ? "Dictate answer" : "Answer by voice"}
          </Button>
        )}
      </div>
      <p role="status" aria-live="assertive" className="min-h-0 text-sm text-muted-foreground empty:hidden">
        {status}
      </p>
    </div>
  );
}

// Alt+R and Alt+V act on the question that has keyboard focus, or the first one on the screen.
export function VoiceShortcuts() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!event.altKey) return;
      const action = event.key.toLowerCase() === "r" ? "read" : event.key.toLowerCase() === "v" ? "listen" : null;
      if (!action) return;
      const scope = (document.activeElement?.closest("article") as HTMLElement | null) ?? document;
      const button = scope.querySelector<HTMLButtonElement>(`[data-voice="${action}"]`);
      if (!button) return;
      event.preventDefault();
      button.click();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

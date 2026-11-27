"use client";

import { Eraser, NotebookPen, PenLine } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { RoughWork } from "./rough-work";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionLabel: string;
  work: RoughWork;
  onChange: (work: RoughWork) => void;
};

const SKETCH_HEIGHT = 360;
const LINE_WIDTH = 2.5;

function SketchPad({ sketch, onSketch }: { sketch: string; onSketch: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Paint the saved sketch once, sized to the drawer, so it survives closing and reopening.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = SKETCH_HEIGHT * window.devicePixelRatio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    if (!sketch) return;
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, canvas.clientWidth, SKETCH_HEIGHT);
    image.src = sketch;
    // Only the first paint needs the saved image; later strokes draw directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawing.current = true;
    const { x, y } = point(event);
    context.strokeStyle = getComputedStyle(event.currentTarget).color;
    context.lineWidth = LINE_WIDTH;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(x, y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const context = event.currentTarget.getContext("2d");
    const { x, y } = point(event);
    context?.lineTo(x, y);
    context?.stroke();
  }

  function end(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    onSketch(event.currentTarget.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onSketch("");
  }

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        aria-label="Sketch area: draw with your finger, pen or mouse"
        className="w-full touch-none rounded-2xl bg-muted text-foreground"
        style={{ height: SKETCH_HEIGHT }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <Button type="button" variant="ghost" className="self-start" onClick={clear}>
        <Eraser aria-hidden className="size-4" />
        Clear sketch
      </Button>
    </div>
  );
}

// Rough work slides in from the right: notes or a sketch per question, saved as you go, never marked.
export function RoughWorkDrawer({ open, onOpenChange, questionLabel, work, onChange }: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-0 bg-card p-0 sm:max-w-md sm:rounded-l-3xl">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-xl font-medium">
            <NotebookPen aria-hidden className="size-5 text-primary" />
            Rough work · {questionLabel}
          </SheetTitle>
          <SheetDescription>Private to you and never marked. Saved as you go, even offline.</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="notes" className="flex flex-col gap-4 p-6 pt-2">
          <TabsList>
            <TabsTrigger value="notes">
              <PenLine aria-hidden className="size-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="sketch">
              <NotebookPen aria-hidden className="size-4" />
              Sketch
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <label htmlFor="rough-notes" className="sr-only">
              Notes for {questionLabel}
            </label>
            <Textarea
              id="rough-notes"
              key={questionLabel}
              defaultValue={work.notes}
              rows={14}
              className="font-mono"
              placeholder="Working, formulas, anything that helps."
              onChange={(event) => onChange({ ...work, notes: event.target.value })}
            />
          </TabsContent>
          <TabsContent value="sketch">
            <SketchPad key={questionLabel} sketch={work.sketch} onSketch={(sketch) => onChange({ ...work, sketch })} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

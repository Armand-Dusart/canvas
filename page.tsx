"use client";
import * as Tone from "tone";
import { useEffect, useMemo, useState } from "react";
import CanvasService, { getNotes } from "./service";
import type { Note } from "@tonejs/midi/dist/Note";

const path = "/midi/Pirates of the Caribbean - He's a Pirate (1).mid";

export default function Page() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      const response = await getNotes(path);
      setNotes(response);
    };

    fetchNotes();
  }, []);

  const service = useMemo(() => {
    if (!notes.length) return;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const service = new CanvasService(2, canvas, notes);

    return service;
  }, [notes]);

  useEffect(() => {
    if (!service) return;
    const start = async () => {
      service.startAnimation();
    };
    start();
  }, [notes]);

  useEffect(() => {
    if (!service) return;
    if (isPlaying) {
      service.resume();
    } else {
      service.pause();
    }
  }, [isPlaying]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-base-100">
      <button
        className="p-4 border text-red"
        onClick={async () => {
          if (isPlaying) {
          } else {
            await Tone.start();
          }
          setIsPlaying(!isPlaying);
        }}
      >
        {isPlaying ? "Stop" : "Play"}
      </button>
      <canvas
        className="border-2 border-red-500"
        id="canvas"
        width={900}
        height={900}
      ></canvas>
    </div>
  );
}

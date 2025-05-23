import React from "react";
import { Midi } from "@tonejs/midi";

import * as Tone from "tone";
import { useEffect, useMemo, useState } from "react";
import CanvasService from "./services/service";
import type { Note } from "@tonejs/midi/dist/Note";

const path = "/midi/pirates.mid";

export async function getNotes(path: string) {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  const midi = new Midi(buffer);
  return midi.tracks[0].notes;
}

export default function App() {
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
    const start = () => {
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
    <div className="content">
      <button
        className="btn"
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

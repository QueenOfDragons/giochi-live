import React, { useEffect, useState } from "react";
import { UI_TEXT } from "./texts/uiText";
import { RotateCcw, ArrowRight } from "lucide-react";

const COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-400",
  "bg-purple-500",
  "bg-pink-500",
];

function generateSolution(colorCount, length = 4) {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * colorCount)
  );
}

function evaluateGuess(guess, solution) {
  let correct = 0;
  let present = 0;

  const sol = [...solution];
  const g = [...guess];

  // posizione giusta
  for (let i = 0; i < g.length; i++) {
    if (g[i] === sol[i]) {
      correct++;
      sol[i] = null;
      g[i] = null;
    }
  }

  // colore presente
  for (let i = 0; i < g.length; i++) {
    if (g[i] === null) continue;
    const idx = sol.indexOf(g[i]);
    if (idx !== -1) {
      present++;
      sol[idx] = null;
    }
  }

  return { correct, present };
}

export default function MastermindGame({ onBack, selectedLanguage }) {
  const t = UI_TEXT[selectedLanguage];

  const [colorCount, setColorCount] = useState(4);
  const [solution, setSolution] = useState(generateSolution(4));
  const [attempts, setAttempts] = useState([]);
  const [current, setCurrent] = useState([]);
  const [status, setStatus] = useState("playing");

  const maxAttempts = 8;
  const length = 4;

  const reset = (colors = colorCount) => {
    setColorCount(colors);
    setSolution(generateSolution(colors));
    setAttempts([]);
    setCurrent([]);
    setStatus("playing");
  };

  const addColor = (index) => {
    if (status !== "playing") return;
    if (current.length >= length) return;
    setCurrent((prev) => [...prev, index]);
  };

  const removeLast = () => {
    setCurrent((prev) => prev.slice(0, -1));
  };

  const submit = () => {
    if (current.length !== length) return;

    const result = evaluateGuess(current, solution);

    const newAttempts = [...attempts, { guess: current, result }];
    setAttempts(newAttempts);

    if (result.correct === length) {
      setStatus("won");
      return;
    }

    if (newAttempts.length >= maxAttempts) {
      setStatus("lost");
      return;
    }

    setCurrent([]);
  };

  const next = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-4 text-center">
          <button onClick={onBack} className="text-sm text-gray-400">
            {t.home.backToMenu}
          </button>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">Mastermind</h1>
        </div>

        {/* scelta colori */}
        <div className="flex justify-center gap-2 mb-4">
          {[4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => reset(n)}
              className={`px-3 py-1 rounded ${
                colorCount === n ? "bg-cyan-500" : "bg-white/10"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* griglia tentativi */}
        <div className="space-y-2 mb-4">
          {attempts.map((row, i) => (
            <div key={i} className="flex justify-center gap-3">
              <div className="flex gap-2">
                {row.guess.map((c, idx) => (
                  <div key={idx} className={`h-6 w-6 rounded-full ${COLORS[c]}`} />
                ))}
              </div>

              <div className="flex gap-1">
                {Array.from({ length: row.result.correct }).map((_, i) => (
                  <div key={`c-${i}`} className="h-3 w-3 bg-black rounded-full" />
                ))}
                {Array.from({ length: row.result.present }).map((_, i) => (
                  <div key={`p-${i}`} className="h-3 w-3 bg-white rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* riga corrente */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center"
            >
              {current[i] !== undefined && (
                <div className={`h-6 w-6 rounded-full ${COLORS[current[i]]}`} />
              )}
            </div>
          ))}
        </div>

        {/* bottoni */}
        <div className="flex justify-center gap-3 mb-4">
          <button onClick={removeLast} className="bg-white/10 px-3 py-2 rounded">
            ⌫
          </button>
          <button onClick={submit} className="bg-cyan-500 px-4 py-2 rounded">
            OK
          </button>
        </div>

        {/* palette colori */}
        <div className="flex justify-center gap-3 mb-4">
          {COLORS.slice(0, colorCount).map((c, i) => (
            <button
              key={i}
              onClick={() => addColor(i)}
              className={`h-10 w-10 rounded-full ${c}`}
            />
          ))}
        </div>

        {/* stato */}
        <div className="text-center mb-4">
          {status === "won" && "Hai vinto 🎉"}
          {status === "lost" && "Hai perso 😈"}
        </div>

        <div className="flex justify-center">
          <button
            onClick={next}
            className="bg-emerald-500 px-4 py-2 rounded flex items-center gap-2"
          >
            <ArrowRight size={16} />
            Avanti
          </button>
        </div>

      </div>
    </div>
  );
}
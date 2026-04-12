import React, { useEffect, useMemo, useRef, useState } from "react";
import { UI_TEXT } from "./texts/uiText";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Shuffle,
  ArrowRight,
  PanelsTopLeft,
} from "lucide-react";

const WORDS_BY_LENGTH = {
  5: [
    "amore", "ansia", "ombra", "notte", "paura", "vento", "cuore", "sogno",
    "fiore", "luceo", "dolce", "tempo", "salto", "fredd", "penso", "mente"
  ],
  6: [
    "segreto", "ricordo", "silenz", "attesa", "vuotoo", "fragil", "battit",
    "dentroo", "sognio", "crollo", "verita", "scelta", "morire", "restar"
  ],
  7: [
    "distanz", "emozion", "pensier", "declino", "nascost", "presenz",
    "confuso", "speranz", "tensione", "impulso", "assenza", "fragile"
  ],
  8: [
    "algoritm", "nostalgi", "memoriee", "silenzio", "bisdetto", "equilibri",
    "distorta", "sospesaa", "imprevist", "relazion", "appiglio"
  ],
  9: [
    "contrasto", "insicurez", "ambiguita", "solitudine", "malinconia",
    "trasparir", "imprevisto", "autosabot", "invisibil"
  ],
  10: [
    "dipendenza", "frammenti", "incomprens", "trasformar", "inafferrab",
    "disarmante", "irriverente"
  ],
  11: [
    "contraddire", "disorientar", "sovrappensi", "irrecuperab", "indelebilee"
  ],
};

// Piccolo aiuto: normalizzo tutte le parole
const NORMALIZED_WORDS = Object.fromEntries(
  Object.entries(WORDS_BY_LENGTH).map(([len, words]) => [
    len,
    words
      .map((w) =>
        String(w)
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      )
      .filter((w) => w.length === Number(len)),
  ])
);

const KEYBOARD_LAYOUTS = {
  it: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"],
    ["n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
  ],
  en: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"],
    ["n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
  ],
  ro: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"],
    ["n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
  ],
  fr: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"],
    ["n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
  ],
};

const MAX_ATTEMPTS = 6;

function normalizeWord(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pickRandomWord(length, currentWord = "") {
  const pool = NORMALIZED_WORDS[length] || [];
  if (pool.length === 0) return "";

  if (pool.length === 1) return pool[0];

  let next = currentWord;
  while (next === currentWord) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  return next;
}

function evaluateGuess(guess, solution) {
  const result = Array(guess.length).fill("absent");
  const solutionChars = solution.split("");
  const guessChars = guess.split("");

  // prima passata: lettere giuste al posto giusto
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === solutionChars[i]) {
      result[i] = "correct";
      solutionChars[i] = null;
      guessChars[i] = null;
    }
  }

  // seconda passata: lettere presenti ma nel posto sbagliato
  for (let i = 0; i < guessChars.length; i++) {
    if (!guessChars[i]) continue;
    const foundIndex = solutionChars.indexOf(guessChars[i]);
    if (foundIndex !== -1) {
      result[i] = "present";
      solutionChars[foundIndex] = null;
    }
  }

  return result;
}

function getKeyStateMap(attempts) {
  const priority = {
    correct: 3,
    present: 2,
    absent: 1,
  };

  const map = {};

  attempts.forEach((attempt) => {
    attempt.word.split("").forEach((char, idx) => {
      const state = attempt.result[idx];
      if (!map[char] || priority[state] > priority[map[char]]) {
        map[char] = state;
      }
    });
  });

  return map;
}

function SecretCell({ value, state, filled = false }) {
  const base =
    "flex h-12 w-12 items-center justify-center rounded-xl border text-lg font-black uppercase shadow-md sm:h-14 sm:w-14 sm:text-xl";

  const stateClass =
    state === "correct"
      ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
      : state === "present"
        ? "border-amber-300 bg-amber-500/20 text-amber-100"
        : state === "absent"
          ? "border-slate-600 bg-slate-700/70 text-slate-200"
          : filled
            ? "border-cyan-300/60 bg-white/10 text-white"
            : "border-white/10 bg-black/20 text-slate-400";

  return (
    <motion.div
      initial={false}
      animate={
        state
          ? { rotateX: [90, 0], scale: [1, 1.04, 1] }
          : filled
            ? { scale: [1, 1.03, 1] }
            : { scale: 1 }
      }
      transition={{ duration: 0.28 }}
      className={`${base} ${stateClass}`}
    >
      {value}
    </motion.div>
  );
}

function SecretGrid({ attempts, currentGuess, wordLength, status, solution }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: MAX_ATTEMPTS }, (_, rowIndex) => {
        const attempt = attempts[rowIndex];
        const currentRow = rowIndex === attempts.length;

        let letters = Array(wordLength).fill("");
        let states = Array(wordLength).fill(null);

        if (attempt) {
          letters = attempt.word.split("");
          states = attempt.result;
        } else if (currentRow && status === "playing") {
          letters = currentGuess.split("");
        } else if (currentRow && status !== "playing" && currentGuess) {
          letters = currentGuess.split("");
        }

        return (
          <div key={rowIndex} className="flex justify-center gap-2">
            {letters.map((char, colIndex) => (
              <SecretCell
                key={`${rowIndex}-${colIndex}`}
                value={
                  status === "lost" && rowIndex === attempts.length && !attempt && solution
                    ? ""
                    : char
                }
                state={states[colIndex]}
                filled={!!char}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Keyboard({ rows, keyStates, onKey, onDelete, onSubmit, disabled }) {
  const stateClass = (key) => {
    const state = keyStates[key];
    if (state === "correct") return "border-emerald-400/50 bg-emerald-500/20 text-emerald-200";
    if (state === "present") return "border-amber-300/50 bg-amber-500/20 text-amber-200";
    if (state === "absent") return "border-slate-600 bg-slate-700/80 text-slate-300";
    return "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
      <div className="space-y-1.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {row.map((key) => (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onKey(key)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold uppercase transition sm:h-9 sm:w-9 sm:text-sm ${stateClass(key)}`}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/15"
        >
          ⌫
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="rounded-xl bg-cyan-500/80 px-4 py-2 text-xs font-semibold transition hover:bg-cyan-500"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function SecretWordGame({ onBack, selectedLanguage }) {
  const t = UI_TEXT[selectedLanguage];
  const localText = UI_TEXT[selectedLanguage].secretword;;

  const [wordLength, setWordLength] = useState(5);
  const [solution, setSolution] = useState(() => pickRandomWord(5));
  const [attempts, setAttempts] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState("playing");
  const [compactMode, setCompactMode] = useState(true);

  const keyStates = useMemo(() => getKeyStateMap(attempts), [attempts]);

  const resetRound = (newLength = wordLength, randomWord = solution) => {
    setWordLength(newLength);
    setSolution(randomWord || pickRandomWord(newLength));
    setAttempts([]);
    setCurrentGuess("");
    setStatus("playing");
  };

  const handleLengthChange = (newLength) => {
    const len = Number(newLength);
    const word = pickRandomWord(len);
    resetRound(len, word);
  };

  const handleKey = (char) => {
    if (status !== "playing") return;
    if (currentGuess.length >= wordLength) return;
    setCurrentGuess((prev) => prev + normalizeWord(char));
  };

  const handleDelete = () => {
    if (status !== "playing") return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (status !== "playing") return;
    if (currentGuess.length !== wordLength) return;

    const result = evaluateGuess(currentGuess, solution);
    const newAttempts = [...attempts, { word: currentGuess, result }];

    setAttempts(newAttempts);

    if (currentGuess === solution) {
      setStatus("won");
      setCurrentGuess("");
      return;
    }

    if (newAttempts.length >= MAX_ATTEMPTS) {
      setStatus("lost");
      setCurrentGuess("");
      return;
    }

    setCurrentGuess("");
  };

  const nextWord = () => {
    const word = pickRandomWord(wordLength, solution);
    resetRound(wordLength, word);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Backspace") {
        event.preventDefault();
        handleDelete();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
        return;
      }

      if (event.key.length === 1) {
        const normalized = normalizeWord(event.key);
        if (/^[a-z]$/.test(normalized)) {
          handleKey(normalized);
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [status, currentGuess, attempts, wordLength, solution]);

  const rows = KEYBOARD_LAYOUTS[selectedLanguage] || KEYBOARD_LAYOUTS.it;
  const canGoNext = status !== "playing";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className={`relative z-10 mx-auto ${compactMode ? "max-w-3xl" : "max-w-6xl"}`}>
        {compactMode ? (
          <div className="flex flex-col rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm sm:p-4">
            <div className="mb-2 flex justify-center">
              <button onClick={onBack} className="text-xs text-slate-400 transition hover:text-white">
                {t.home.backToMenu}
              </button>
            </div>

            <div className="mb-3 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => resetRound()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] transition hover:bg-white/15 sm:text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {localText.restart}
              </button>

              <button
                onClick={nextWord}
                className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500/80 px-2.5 py-2 text-[11px] transition hover:bg-pink-500 sm:text-xs"
              >
                <Shuffle className="h-3.5 w-3.5" />
                {localText.random}
              </button>

              <button
                onClick={() => setCompactMode((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] transition hover:bg-white/15 sm:text-xs"
              >
                <PanelsTopLeft className="h-3.5 w-3.5" />
                {compactMode ? t.hangman.showPanels : t.hangman.hidePanels}
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-linear-to-r from-fuchsia-600/20 via-purple-600/20 to-cyan-500/20 p-3 text-center">
              <div className="text-lg font-bold">{localText.title}</div>
              <div className="mt-1 text-sm text-slate-200">{localText.subtitle}</div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-sm text-slate-300">{localText.lengthLabel}</span>
              <select
                value={wordLength}
                onChange={(e) => handleLengthChange(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              >
                {[5, 6, 7, 8, 9, 10, 11].map((len) => (
                  <option key={len} value={len}>
                    {len}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 text-center text-xs text-slate-400">
              {localText.attempts}: {attempts.length}/{MAX_ATTEMPTS}
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/60 p-3">
              <SecretGrid
                attempts={attempts}
                currentGuess={currentGuess}
                wordLength={wordLength}
                status={status}
                solution={solution}
              />
            </div>

            <div className="mt-3 flex w-full items-center justify-between">
              <div className="flex-1" />

              <div className="flex flex-1 justify-center">
                <div className="rounded-2xl border border-cyan-300/30 bg-white/5 px-4 py-3 text-center">
                  <div className="text-sm font-bold text-cyan-200">LV</div>
                  <div className="mt-1 text-xs text-slate-300">
                    {status === "won"
                      ? localText.won
                      : status === "lost"
                        ? `${localText.lost}: ${solution.toUpperCase()}`
                        : `${wordLength} lettere`}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={nextWord}
                  disabled={!canGoNext}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    !canGoNext
                      ? "cursor-not-allowed bg-white/5 text-slate-500"
                      : "bg-emerald-500/80 text-white hover:bg-emerald-500"
                  }`}
                >
                  {localText.next}
                </button>
              </div>
            </div>

            <div className="mt-3">
              <Keyboard
                rows={rows}
                keyStates={keyStates}
                onKey={handleKey}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
                disabled={status !== "playing"}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm md:p-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-pink-300/80">
                    {localText.title}
                  </p>
                  <h1 className="text-2xl font-bold md:text-4xl">{localText.subtitle}</h1>
                </div>

                <div className="mb-2 flex justify-center">
                  <button onClick={onBack} className="text-xs text-slate-400 transition hover:text-white">
                    {t.home.backToMenu}
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => resetRound()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] transition hover:bg-white/15 sm:text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {localText.restart}
                  </button>

                  <button
                    onClick={nextWord}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500/80 px-2.5 py-2 text-[11px] transition hover:bg-pink-500 sm:text-xs"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    {localText.random}
                  </button>

                  <button
                    onClick={() => setCompactMode((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] transition hover:bg-white/15 sm:text-xs"
                  >
                    <PanelsTopLeft className="h-3.5 w-3.5" />
                    {compactMode ? t.hangman.showPanels : t.hangman.hidePanels}
                  </button>
                </div>
              </div>

              <div className="mb-5 rounded-3xl border border-white/10 bg-linear-to-r from-fuchsia-600/20 via-purple-600/20 to-cyan-500/20 p-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm text-slate-200">{localText.lengthLabel}</span>
                  <select
                    value={wordLength}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                  >
                    {[5, 6, 7, 8, 9, 10, 11].map((len) => (
                      <option key={len} value={len}>
                        {len}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 flex w-full items-center justify-between">
                <div className="flex-1" />

                <div className="flex flex-1 justify-center">
                  <div className="rounded-2xl border border-cyan-300/30 bg-white/5 px-5 py-4 text-center">
                    <div className="text-base font-bold text-cyan-200">LV</div>
                    <div className="mt-1 text-xs text-slate-300">
                      {status === "won"
                        ? localText.won
                        : status === "lost"
                          ? `${localText.lost}: ${solution.toUpperCase()}`
                          : `${wordLength} lettere • ${localText.attempts}: ${attempts.length}/${MAX_ATTEMPTS}`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-end gap-2.5">
                  <button
                    type="button"
                    onClick={nextWord}
                    disabled={!canGoNext}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      !canGoNext
                        ? "cursor-not-allowed bg-white/5 text-slate-500"
                        : "bg-emerald-500/80 text-white hover:bg-emerald-500"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowRight className="h-3.5 w-3.5" />
                      {localText.next}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mb-4 rounded-3xl border border-white/10 bg-black/20 p-3">
                <SecretGrid
                  attempts={attempts}
                  currentGuess={currentGuess}
                  wordLength={wordLength}
                  status={status}
                  solution={solution}
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <Keyboard
                  rows={rows}
                  keyStates={keyStates}
                  onKey={handleKey}
                  onDelete={handleDelete}
                  onSubmit={handleSubmit}
                  disabled={status !== "playing"}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
                <h2 className="mb-4 text-xl font-bold">{localText.title}</h2>
                <div className="space-y-3 text-sm text-slate-300">
                  <div>• Scegli la lunghezza da 5 a 11</div>
                  <div>• Scrivi da tastiera PC oppure usa la tastiera a schermo</div>
                  <div>• Verde = giusto</div>
                  <div>• Giallo = presente</div>
                  <div>• Grigio = assente</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
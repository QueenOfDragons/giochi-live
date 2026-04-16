import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ArrowRight } from "lucide-react";
import { UI_TEXT } from "./texts/uiText";

// ─── Definizione colori con nome ed iniziale per ogni lingua ───────────────
const COLOR_DEFS = [
  {
    id: "red",
    bg: "bg-red-500",
    shadow: "shadow-red-500/60",
    ring: "ring-red-300",
    hex: "#ef4444",
    labels: { it: "Rosso",  en: "Red",    fr: "Rouge",  ro: "Roșu"   },
  },
  {
    id: "blue",
    bg: "bg-blue-500",
    shadow: "shadow-blue-500/60",
    ring: "ring-blue-300",
    hex: "#3b82f6",
    labels: { it: "Blu",    en: "Blue",   fr: "Bleu",   ro: "Albastru" },
  },
  {
    id: "green",
    bg: "bg-emerald-500",
    shadow: "shadow-emerald-500/60",
    ring: "ring-emerald-300",
    hex: "#10b981",
    labels: { it: "Verde",  en: "Green",  fr: "Vert",   ro: "Verde"  },
  },
  {
    id: "yellow",
    bg: "bg-yellow-400",
    shadow: "shadow-yellow-400/60",
    ring: "ring-yellow-200",
    hex: "#facc15",
    labels: { it: "Giallo", en: "Yellow", fr: "Jaune",  ro: "Galben" },
  },
  {
    id: "cyan",
    bg: "bg-cyan-400",
    shadow: "shadow-cyan-400/60",
    ring: "ring-cyan-200",
    hex: "#22d3ee",
    labels: { it: "Ciano",     en: "Cyan",   fr: "Cyan",   ro: "Cyan"    },
  },
  {
    id: "orange",
    bg: "bg-orange-500",
    shadow: "shadow-orange-500/60",
    ring: "ring-orange-300",
    hex: "#f97316",
    labels: { it: "Arancione", en: "Orange", fr: "Orange", ro: "Portocaliu" },
  },
];

const MAX_ATTEMPTS = 8;
const CODE_LENGTH = 4;

function generateSolution(colorCount) {
  return Array.from({ length: CODE_LENGTH }, () =>
    Math.floor(Math.random() * colorCount)
  );
}

function evaluateGuess(guess, solution) {
  let correct = 0;
  let present = 0;
  const sol = [...solution];
  const g = [...guess];

  for (let i = 0; i < g.length; i++) {
    if (g[i] === sol[i]) {
      correct++;
      sol[i] = null;
      g[i] = null;
    }
  }
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

// ─── Pallino colore grande ─────────────────────────────────────────────────
function ColorBall({ colorDef, size = "lg", onClick, disabled = false, initial, selected = false, lang = "en" }) {
  const sizeClass = size === "lg"
    ? "h-14 w-14 sm:h-16 sm:w-16 text-base sm:text-lg"
    : size === "md"
    ? "h-11 w-11 sm:h-12 sm:w-12 text-sm"
    : "h-8 w-8 text-xs";

  const label = colorDef.labels[lang] || colorDef.labels.en;
  const initial_char = label.charAt(0).toUpperCase();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.12, y: -3 } : {}}
      whileTap={!disabled ? { scale: 0.93 } : {}}
      className={`
        ${sizeClass} rounded-full font-black text-white/90
        ${colorDef.bg}
        shadow-lg ${colorDef.shadow}
        ${selected ? `ring-4 ${colorDef.ring} ring-offset-2 ring-offset-slate-900` : ""}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        flex items-center justify-center
        transition-shadow duration-150
        select-none
      `}
      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
    >
      {initial_char}
    </motion.button>
  );
}

// ─── Pallino risultato (verde/giallo/grigio) ───────────────────────────────
function ResultDot({ type }) {
  const cls =
    type === "correct"
      ? "bg-emerald-400 shadow-emerald-400/60"
      : type === "present"
      ? "bg-amber-300 shadow-amber-300/60"
      : "bg-slate-600";
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`h-4 w-4 rounded-full shadow-md ${cls}`}
    />
  );
}

// ─── Riga tentativo già confermato ────────────────────────────────────────
function AttemptRow({ attempt, lang, attemptNumber }) {
  const dots = [
    ...Array(attempt.result.correct).fill("correct"),
    ...Array(attempt.result.present).fill("present"),
    ...Array(CODE_LENGTH - attempt.result.correct - attempt.result.present).fill("absent"),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <span className="w-5 text-right text-xs font-bold text-slate-500">{attemptNumber}</span>

      <div className="flex gap-2">
        {attempt.guess.map((colorIdx, i) => (
          <div
            key={i}
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full ${COLOR_DEFS[colorIdx].bg} shadow-md ${COLOR_DEFS[colorIdx].shadow} flex items-center justify-center`}
          >
            <span className="text-xs font-black text-white/80" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
              {COLOR_DEFS[colorIdx].labels[lang]?.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 ml-1">
        {dots.map((type, i) => (
          <ResultDot key={i} type={type} />
        ))}
      </div>

      <div className="ml-1 text-xs text-slate-400">
        <span className="text-emerald-400 font-bold">{attempt.result.correct}</span>
        <span className="text-slate-600">·</span>
        <span className="text-amber-300 font-bold">{attempt.result.present}</span>
      </div>
    </motion.div>
  );
}

// ─── Riga corrente (quella in costruzione) ────────────────────────────────
function CurrentRow({ current, onRemove }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.01, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="flex items-center gap-3"
    >
      <span className="w-5" />
      <div className="flex gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <motion.div
            key={i}
            className={`
              h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2
              ${current[i] !== undefined
                ? `${COLOR_DEFS[current[i]].bg} ${COLOR_DEFS[current[i]].shadow} shadow-md border-transparent`
                : "border-white/20 bg-white/5"
              }
              flex items-center justify-center
            `}
            animate={current[i] !== undefined ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {current[i] !== undefined && (
              <span className="text-xs font-black text-white/80" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                {COLOR_DEFS[current[i]].labels["en"]?.charAt(0).toUpperCase()}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      {current.length > 0 && (
        <button
          onClick={onRemove}
          className="ml-1 text-slate-400 hover:text-white transition text-lg leading-none"
        >
          ⌫
        </button>
      )}
    </motion.div>
  );
}

// ─── Righe vuote (futuri tentativi) ──────────────────────────────────────
function EmptyRow() {
  return (
    <div className="flex items-center gap-3 opacity-25">
      <span className="w-5" />
      <div className="flex gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <div key={i} className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-white/10 bg-white/3" />
        ))}
      </div>
    </div>
  );
}

// ─── Legenda colori ───────────────────────────────────────────────────────
function ColorLegend({ colorCount, lang }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">

      {/* Pallini + nomi */}
      <div className="flex flex-wrap justify-center gap-3">
        {COLOR_DEFS.slice(0, colorCount).map((c) => {
          const label = c.labels[lang] || c.labels.en;
          const initial = label.charAt(0).toUpperCase();
          return (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <div className={`h-9 w-9 rounded-full ${c.bg} shadow-md ${c.shadow} flex items-center justify-center`}>
                <span className="text-sm font-black text-white/90" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                  {initial}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-200">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Spiegazione puntini risultato */}
      <div className="border-t border-white/10 pt-2.5 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
          <span className="text-xs text-slate-300"><span className="text-emerald-400 font-bold">Verde</span> = colore e posizione giusti</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-amber-300 shadow-md shadow-amber-300/50" />
          <span className="text-xs text-slate-300"><span className="text-amber-300 font-bold">Giallo</span> = colore giusto, posizione sbagliata</span>
        </div>
      </div>

    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────
export default function MastermindGame({ onBack, selectedLanguage }) {
  const t = UI_TEXT[selectedLanguage];
  const lang = selectedLanguage || "en";

  const [colorCount, setColorCount] = useState(4);
  const [solution, setSolution] = useState(() => generateSolution(4));
  const [attempts, setAttempts] = useState([]);
  const [current, setCurrent] = useState([]);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [shake, setShake] = useState(false);
  const gridRef = useRef(null);

  const attemptsLeft = MAX_ATTEMPTS - attempts.length;

  const reset = (colors = colorCount) => {
    setColorCount(colors);
    setSolution(generateSolution(colors));
    setAttempts([]);
    setCurrent([]);
    setStatus("playing");
    setShake(false);
  };

  const addColor = (index) => {
    if (status !== "playing") return;
    if (current.length >= CODE_LENGTH) return;
    setCurrent((prev) => [...prev, index]);
  };

  const removeLast = () => {
    if (status !== "playing") return;
    setCurrent((prev) => prev.slice(0, -1));
  };

  const submit = () => {
    if (status !== "playing") return;
    if (current.length !== CODE_LENGTH) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    const result = evaluateGuess(current, solution);
    const newAttempts = [...attempts, { guess: current, result }];
    setAttempts(newAttempts);
    setCurrent([]);

    if (result.correct === CODE_LENGTH) {
      setStatus("won");
    } else if (newAttempts.length >= MAX_ATTEMPTS) {
      setStatus("lost");
    }

    // scroll automatico in fondo alla griglia
    setTimeout(() => {
      gridRef.current?.scrollTo({ top: gridRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  // scorciatoia tastiera: Invio = conferma, Backspace = cancella
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") submit();
      if (e.key === "Backspace") removeLast();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, status]);

  const remainingRows = Math.max(0, MAX_ATTEMPTS - attempts.length - (status === "playing" ? 1 : 0));

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">

      {/* Sfondo decorativo vivace */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Flash vittoria */}
      <AnimatePresence>
        {status === "won" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-emerald-400 z-0"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {status === "lost" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-red-500 z-0"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-5">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onBack} className="text-xs text-slate-400 hover:text-white transition">
            {t.home.backToMenu}
          </button>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Mastermind
          </h1>
          <button
            onClick={() => reset()}
            className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15 transition"
          >
            <RotateCcw className="h-3 w-3" />
            {t.mastermind?.next || "New"}
          </button>
        </div>

        {/* Selettore numero colori */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="text-xs text-slate-400">{t.mastermind?.colors || "Colors"}:</span>
          {[4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => reset(n)}
              className={`h-8 w-8 rounded-xl text-sm font-bold transition ${
                colorCount === n
                  ? "bg-gradient-to-br from-cyan-500 to-orange-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-white/10 text-slate-300 hover:bg-white/15"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Legenda iniziali colori */}
        <div className="mb-4">
          <ColorLegend colorCount={colorCount} lang={lang} />
        </div>

        {/* Griglia tentativi */}
        <motion.div
          animate={shake ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm"
        >
          {/* Intestazione colonne */}
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="w-5" />
            <div className="flex gap-2">
              {Array.from({ length: CODE_LENGTH }, (_, i) => (
                <div key={i} className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center">
                  <span className="text-xs text-slate-500 font-bold">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="ml-1 grid grid-cols-2 gap-1">
              <div className="h-3 w-3 rounded-full bg-emerald-400" title="colore e posizione giusti" />
              <div className="h-3 w-3 rounded-full bg-amber-300" title="colore giusto, posizione sbagliata" />
              <div className="h-3 w-3 rounded-full bg-slate-600" />
              <div className="h-3 w-3 rounded-full bg-slate-600" />
            </div>
          </div>

          <div
            ref={gridRef}
            className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin"
          >
            {/* Righe già confermate */}
            {attempts.map((attempt, i) => (
              <AttemptRow key={i} attempt={attempt} lang={lang} attemptNumber={i + 1} />
            ))}

            {/* Riga corrente */}
            {status === "playing" && (
              <CurrentRow current={current} onRemove={removeLast} />
            )}

            {/* Righe vuote future */}
            {status === "playing" && Array.from({ length: remainingRows }, (_, i) => (
              <EmptyRow key={`empty-${i}`} />
            ))}
          </div>
        </motion.div>

        {/* Contatore tentativi */}
        <div className="mb-3 text-center text-xs text-slate-400">
          {status === "playing"
            ? `${t.hangman?.errors || "Attempts"}: ${attempts.length} / ${MAX_ATTEMPTS}`
            : status === "won"
            ? <span className="text-emerald-400 font-bold text-base">{t.mastermind?.won || "You won 🎉"}</span>
            : null
          }
        </div>

        {/* Messaggio sconfitta + soluzione */}
        <AnimatePresence>
          {status === "lost" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center"
            >
              <div className="text-base font-bold text-rose-300 mb-2">
                {t.mastermind?.lost || "You lost 😈"}
              </div>
              <div className="text-xs text-slate-400 mb-2">{t.mastermind?.solution || "Solution"}:</div>
              <div className="flex justify-center gap-2">
                {solution.map((colorIdx, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                    className={`h-12 w-12 rounded-full ${COLOR_DEFS[colorIdx].bg} shadow-lg ${COLOR_DEFS[colorIdx].shadow} flex items-center justify-center`}
                  >
                    <span className="text-sm font-black text-white/90">
                      {COLOR_DEFS[colorIdx].labels[lang]?.charAt(0).toUpperCase()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Palette colori selezionabili */}
        {status === "playing" && (
          <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap justify-center gap-3">
              {COLOR_DEFS.slice(0, colorCount).map((colorDef, i) => (
                <ColorBall
                  key={colorDef.id}
                  colorDef={colorDef}
                  size="md"
                  onClick={() => addColor(i)}
                  disabled={current.length >= CODE_LENGTH}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottoni azione */}
        <div className="flex justify-center gap-3">
          {status === "playing" ? (
            <>
              <button
                onClick={removeLast}
                disabled={current.length === 0}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  current.length === 0
                    ? "bg-white/5 text-slate-600 cursor-not-allowed"
                    : "bg-white/10 hover:bg-white/15 text-white"
                }`}
              >
                ⌫ Undo
              </button>

              <motion.button
                onClick={submit}
                disabled={current.length !== CODE_LENGTH}
                whileHover={current.length === CODE_LENGTH ? { scale: 1.04 } : {}}
                whileTap={current.length === CODE_LENGTH ? { scale: 0.97 } : {}}
                className={`rounded-2xl px-6 py-2.5 text-sm font-bold transition shadow-lg ${
                  current.length !== CODE_LENGTH
                    ? "bg-white/5 text-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-orange-500 text-white shadow-cyan-500/30"
                }`}
              >
                ✓ OK
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={() => reset()}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30"
            >
              <ArrowRight className="h-4 w-4" />
              {t.mastermind?.next || "Next"}
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
}

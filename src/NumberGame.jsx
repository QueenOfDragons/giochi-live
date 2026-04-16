import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ArrowRight, Heart } from "lucide-react";
import { UI_TEXT } from "./texts/uiText";

// ─── Calcola tentativi massimi dal range ───────────────────────────────────
// Usa log2 arrotondato per eccesso + 2 margini = ottimale per bisezione
function calcMaxAttempts(min, max) {
  const range = max - min + 1;
  return Math.ceil(Math.log2(range)) + 2;
}

// ─── Calcola "temperatura" della vicinanza ────────────────────────────────
function getTemperature(guess, secret, min, max) {
  const range = max - min;
  const dist = Math.abs(guess - secret);
  const pct = dist / range;
  if (pct === 0)   return "exact";
  if (pct < 0.05)  return "hot";
  if (pct < 0.15)  return "warm";
  if (pct < 0.35)  return "cool";
  return "cold";
}

const TEMP_CONFIG = {
  exact: { label: { it: "🎯 Esatto!", en: "🎯 Exact!", fr: "🎯 Exact !", ro: "🎯 Exact!" },       bar: "bg-emerald-400", glow: "shadow-emerald-400/60" },
  hot:   { label: { it: "🔥 Fuoco!",  en: "🔥 Hot!",   fr: "🔥 Chaud !", ro: "🔥 Fierbinte!" },  bar: "bg-orange-400",  glow: "shadow-orange-400/60" },
  warm:  { label: { it: "🌡️ Tiepido", en: "🌡️ Warm",  fr: "🌡️ Tiède",  ro: "🌡️ Cald" },        bar: "bg-yellow-400",  glow: "shadow-yellow-400/60" },
  cool:  { label: { it: "❄️ Freddo",  en: "❄️ Cool",   fr: "❄️ Froid",  ro: "❄️ Rece" },         bar: "bg-cyan-400",    glow: "shadow-cyan-400/60" },
  cold:  { label: { it: "🧊 Gelato",  en: "🧊 Cold",   fr: "🧊 Glacé",  ro: "🧊 Îngheţat" },     bar: "bg-blue-400",    glow: "shadow-blue-400/60" },
};

// ─── Barra visiva di avvicinamento ────────────────────────────────────────
function ProximityBar({ guess, secret, min, max }) {
  const range = max - min;
  const pct = range === 0 ? 1 : 1 - Math.abs(guess - secret) / range;
  const temp = getTemperature(guess, secret, min, max);
  const cfg = TEMP_CONFIG[temp];

  return (
    <div className="w-full">
      <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(pct * 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${cfg.bar} shadow-md ${cfg.glow}`}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{min}</span>
        <span className={`font-bold text-xs ${
          temp === "exact" ? "text-emerald-400" :
          temp === "hot"   ? "text-orange-400"  :
          temp === "warm"  ? "text-yellow-400"  :
          temp === "cool"  ? "text-cyan-400"    : "text-blue-400"
        }`}>{cfg.label[Object.keys(cfg.label)[0]]}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ─── Riga singolo tentativo ───────────────────────────────────────────────
function GuessRow({ guess, secret, min, max, index, direction }) {
  const temp = getTemperature(guess, secret, min, max);
  const cfg = TEMP_CONFIG[temp];
  const isExact = temp === "exact";

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${
        isExact
          ? "border-emerald-400/40 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <span className="w-5 text-right text-xs font-bold text-slate-500">{index}</span>

      <span className={`text-xl font-black w-16 text-center ${
        isExact ? "text-emerald-400" : "text-white"
      }`}>
        {guess}
      </span>

      {!isExact && (
        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
          direction === "higher"
            ? "bg-orange-500/20 text-orange-300"
            : "bg-blue-500/20 text-blue-300"
        }`}>
          {direction === "higher" ? "▲" : "▼"}
        </span>
      )}

      <div className="flex-1">
        <ProximityBar guess={guess} secret={secret} min={min} max={max} />
      </div>
    </motion.div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────
export default function NumberGame({ onBack, selectedLanguage }) {
  const t = UI_TEXT[selectedLanguage];
  const lang = selectedLanguage || "it";
  const nt = t.numbergame || {};

  // ─ Configurazione round
  const [minVal, setMinVal]     = useState(1);
  const [maxVal, setMaxVal]     = useState(100);
  const [minInput, setMinInput] = useState("1");
  const [maxInput, setMaxInput] = useState("100");

  // ─ Stato gioco
  const [secret, setSecret]       = useState(null);
  const [guesses, setGuesses]     = useState([]);
  const [inputNum, setInputNum]   = useState("");
  const [status, setStatus]       = useState("setup"); // setup | playing | won | lost
  const [lastDir, setLastDir]     = useState(null);
  const [shake, setShake]         = useState(false);

  const inputRef = useRef(null);
  const maxAttempts = calcMaxAttempts(minVal, maxVal);

  // ─ Avvia round
  const startRound = () => {
    const mn = parseInt(minInput, 10);
    const mx = parseInt(maxInput, 10);
    if (isNaN(mn) || isNaN(mx) || mn >= mx) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setMinVal(mn);
    setMaxVal(mx);
    const s = Math.floor(Math.random() * (mx - mn + 1)) + mn;
    setSecret(s);
    setGuesses([]);
    setInputNum("");
    setLastDir(null);
    setStatus("playing");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const reset = () => {
    setSecret(null);
    setGuesses([]);
    setInputNum("");
    setLastDir(null);
    setStatus("setup");
  };

  // ─ Conferma tentativo
  const submitGuess = () => {
    if (status !== "playing") return;
    const num = parseInt(inputNum, 10);
    if (isNaN(num) || num < minVal || num > maxVal) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    const dir = num < secret ? "higher" : num > secret ? "lower" : "exact";
    const newGuesses = [...guesses, { value: num, direction: dir }];
    setGuesses(newGuesses);
    setLastDir(dir);
    setInputNum("");

    if (num === secret) {
      setStatus("won");
    } else if (newGuesses.length >= maxAttempts) {
      setStatus("lost");
    }

    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Invio da tastiera
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") {
        if (status === "setup") startRound();
        else if (status === "playing") submitGuess();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, inputNum, minInput, maxInput]);

  const heartsArray = Array.from({ length: maxAttempts }, (_, i) => i >= guesses.length);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">

      {/* Sfondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-600/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
      </div>

      {/* Flash vittoria/sconfitta */}
      <AnimatePresence>
        {status === "won" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-emerald-400 z-0" />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {status === "lost" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-red-500 z-0" />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-4">

        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <button onClick={onBack} className="text-xs text-slate-400 hover:text-white transition">
            {t.home?.backToMenu || "← Menu"}
          </button>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent">
            {nt.title || "Indovina il Numero"}
          </h1>
          <button onClick={reset}
            className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15 transition">
            <RotateCcw className="h-3 w-3" />
            {nt.reset || "Reset"}
          </button>
        </div>

        {/* ─ SETUP ──────────────────────────────────────────────────────── */}
        {status === "setup" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl"
          >
            <p className="text-center text-sm text-slate-300 mb-5">
              {nt.setupDesc || "Scegli il range dei numeri per questo round"}
            </p>

            <motion.div
              animate={shake ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center justify-center gap-3 mb-5"
            >
              <div className="flex flex-col items-center gap-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-400">
                  {nt.from || "Da"}
                </label>
                <input
                  type="number"
                  value={minInput}
                  onChange={e => setMinInput(e.target.value)}
                  className="w-24 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-center text-xl font-bold text-white outline-none focus:border-orange-400"
                />
              </div>

              <span className="text-2xl text-slate-500 mt-4">→</span>

              <div className="flex flex-col items-center gap-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-400">
                  {nt.to || "A"}
                </label>
                <input
                  type="number"
                  value={maxInput}
                  onChange={e => setMaxInput(e.target.value)}
                  className="w-24 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-center text-xl font-bold text-white outline-none focus:border-orange-400"
                />
              </div>
            </motion.div>

            {/* Preset rapidi */}
            <div className="flex justify-center gap-2 mb-5">
              {[[1,50],[1,100],[1,500],[1,1000]].map(([mn, mx]) => (
                <button key={mx}
                  onClick={() => { setMinInput(String(mn)); setMaxInput(String(mx)); }}
                  className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15 transition"
                >
                  {mn}–{mx}
                </button>
              ))}
            </div>

            <div className="text-center text-xs text-slate-500 mb-5">
              {nt.attemptsInfo || "Tentativi:"} <span className="font-bold text-slate-300">
                {calcMaxAttempts(
                  parseInt(minInput,10) || 1,
                  parseInt(maxInput,10) || 100
                )}
              </span>
            </div>

            <motion.button
              onClick={startRound}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/30"
            >
              {nt.start || "🎲 Inizia il round!"}
            </motion.button>
          </motion.div>
        )}

        {/* ─ PLAYING / WON / LOST ───────────────────────────────────────── */}
        {status !== "setup" && (
          <>
            {/* Range + cuoricini */}
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">
                  {nt.range || "Range"}: <span className="font-bold text-white">{minVal} → {maxVal}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {guesses.length}/{maxAttempts}
                </span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {heartsArray.map((alive, i) => (
                  <motion.div key={i}
                    initial={false}
                    animate={alive ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 0.3 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-lg border px-1 py-0.5 ${alive ? "border-rose-400/50 bg-rose-500/20" : "border-slate-700 bg-slate-800"}`}
                  >
                    <Heart className={`h-3 w-3 ${alive ? "fill-rose-400 text-rose-300" : "text-slate-600"}`} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Input tentativo */}
            {status === "playing" && (
              <motion.div
                animate={shake ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3"
              >
                <input
                  ref={inputRef}
                  type="number"
                  value={inputNum}
                  onChange={e => setInputNum(e.target.value)}
                  placeholder={`${minVal} – ${maxVal}`}
                  className="flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-slate-600"
                  min={minVal}
                  max={maxVal}
                />
                <motion.button
                  onClick={submitGuess}
                  disabled={!inputNum}
                  whileHover={inputNum ? { scale: 1.05 } : {}}
                  whileTap={inputNum ? { scale: 0.95 } : {}}
                  className={`rounded-xl px-5 py-2 text-sm font-bold transition ${
                    !inputNum
                      ? "bg-white/5 text-slate-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-500/30"
                  }`}
                >
                  ✓ OK
                </motion.button>
              </motion.div>
            )}

            {/* Messaggio fine partita */}
            <AnimatePresence>
              {status === "won" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center"
                >
                  <div className="text-2xl font-black text-emerald-400 mb-1">
                    {nt.won || "🎉 Trovato!"}
                  </div>
                  <div className="text-sm text-slate-300">
                    {nt.wonIn || "In"} <span className="font-bold text-white">{guesses.length}</span> {nt.attempts || "tentativi"}
                  </div>
                </motion.div>
              )}
              {status === "lost" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-center"
                >
                  <div className="text-lg font-black text-rose-400 mb-1">
                    {nt.lost || "😈 Tempo scaduto!"}
                  </div>
                  <div className="text-sm text-slate-300">
                    {nt.solution || "Era il"}: <span className="text-2xl font-black text-white ml-1">{secret}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottone nuovo round */}
            {status !== "playing" && (
              <div className="mb-3 flex justify-center gap-3">
                <motion.button onClick={startRound}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30"
                >
                  <ArrowRight className="h-4 w-4" />
                  {nt.nextRound || "Nuovo round"}
                </motion.button>
                <motion.button onClick={reset}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  {nt.changeRange || "Cambia range"}
                </motion.button>
              </div>
            )}

            {/* Storico tentativi */}
            {guesses.length > 0 && (
              <div className="space-y-2">
                {[...guesses].reverse().map((g, i) => (
                  <GuessRow
                    key={guesses.length - 1 - i}
                    guess={g.value}
                    secret={secret}
                    min={minVal}
                    max={maxVal}
                    index={guesses.length - i}
                    direction={g.direction}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { RotateCcw, Upload, ChevronRight, Plus, Check, SkipForward } from "lucide-react";

const DEFAULT_CHAINS = [
  { words: ["FIUME", "LETTO", "CAMERA", "DEPUTATI", "GOVERNO", "MINISTRO", "PORTAFOGLIO", "VUOTO"], category: "Politica", difficulty: "Media" },
  { words: ["CANE", "PESCE", "SPADA", "LEGNO", "DURO", "TESTA", "CODA", "VOLPE"], category: "Misto", difficulty: "Facile" },
  { words: ["SOLE", "MARE", "SALE", "GROSSO", "CALIBRO", "LUNGO", "RAGGIO", "VERDE"], category: "Misto", difficulty: "Difficile" },
];

const TIMER_OPTIONS = [30, 45, 60, 90, 120];

function parseChains(rows) {
  if (!rows || rows.length < 2) return [];
  const header = rows[0].map(v => String(v ?? "").toLowerCase().trim());
  const w = (n) => header.findIndex(h => h.includes(n));
  const idxs = [w("word1"), w("word2"), w("word3"), w("word4"), w("word5"), w("word6"), w("word7"), w("word8")];
  const catIdx = w("category") >= 0 ? w("category") : w("categ");
  const diffIdx = w("difficulty") >= 0 ? w("difficulty") : w("diffi");
  if (idxs.some(i => i < 0)) return [];
  return rows.slice(1).map(row => ({
    words: idxs.map(i => String(row?.[i] ?? "").trim().toUpperCase()).filter(Boolean),
    category: catIdx >= 0 ? String(row?.[catIdx] ?? "").trim() : "",
    difficulty: diffIdx >= 0 ? String(row?.[diffIdx] ?? "").trim() : "Media",
  })).filter(c => c.words.length === 8);
}

function calcScore(lettersRevealed) {
  if (lettersRevealed === 0) return 5;
  if (lettersRevealed === 1) return 4;
  if (lettersRevealed === 2) return 3;
  if (lettersRevealed === 3) return 2;
  return 1;
}

export default function CatenaGame({ onBack, competitionMode = false }) {
  const [chains, setChains] = useState(DEFAULT_CHAINS);
  const [chainIdx, setChainIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(1);
  const [lettersRevealed, setLettersRevealed] = useState(0);
  const [timerDuration, setTimerDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [flashMode, setFlashMode] = useState("none");
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [chainDone, setChainDone] = useState(false);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const chain = chains[chainIdx] || DEFAULT_CHAINS[0];
  const currentWord = chain.words[wordIdx] || "";
  const revealed = currentWord.slice(0, lettersRevealed);
  const hidden = currentWord.slice(lettersRevealed);
  const isLastWord = wordIdx === 6;
  const timerPct = (timeLeft / timerDuration) * 100;
  const timerColor = timeLeft > timerDuration * 0.5 ? "#34d399" : timeLeft > timerDuration * 0.25 ? "#fbbf24" : "#f87171";

  const diffColor = {
    Facile:    "bg-emerald-500/20 text-emerald-300",
    Media:     "bg-amber-500/20 text-amber-300",
    Difficile: "bg-rose-500/20 text-rose-300",
  }[chain.difficulty] || "bg-slate-500/20 text-slate-300";

  useEffect(() => {
    if (timerRunning && !paused && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerRunning && !paused && timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, paused, timeLeft]);

  const startTimer = useCallback(() => {
    setTimeLeft(timerDuration);
    setTimerRunning(true);
  }, [timerDuration]);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!chainDone && gameStarted) {
      setLettersRevealed(0);
      setPaused(false);
      startTimer();
    }
  }, [wordIdx, chainIdx, gameStarted]);

  const addLetter = () => {
    if (lettersRevealed < currentWord.length) {
      setLettersRevealed(l => l + 1);
      startTimer();
    }
  };

  const markCorrect = () => {
    stopTimer();
    if (competitionMode) setScore(s => s + calcScore(lettersRevealed));
    setSolved(prev => [...prev, { wordIdx, lettersRevealed }]);
    setFlashMode("correct");
    setTimeout(() => {
      setFlashMode("none");
      if (isLastWord) setChainDone(true);
      else setWordIdx(w => w + 1);
    }, 500);
  };

  const skipWord = () => {
    stopTimer();
    setSkipped(prev => [...prev, wordIdx]);
    setFlashMode("skip");
    setTimeout(() => {
      setFlashMode("none");
      if (isLastWord) setChainDone(true);
      else setWordIdx(w => w + 1);
    }, 400);
  };

  const nextChain = () => {
    const next = chainIdx + 1 < chains.length ? chainIdx + 1 : 0;
    setChainIdx(next);
    setWordIdx(1);
    setLettersRevealed(0);
    setSolved([]);
    setSkipped([]);
    setChainDone(false);
    setFlashMode("none");
    setPaused(false);
    setGameStarted(false);
    stopTimer();
  };

  const reset = () => {
    setChainIdx(0);
    setWordIdx(1);
    setLettersRevealed(0);
    setSolved([]);
    setSkipped([]);
    setChainDone(false);
    setScore(0);
    setFlashMode("none");
    setPaused(false);
    setGameStarted(false);
    stopTimer();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
      const parsed = parseChains(rows);
      if (parsed.length > 0) { setChains(parsed); reset(); }
    } catch (err) { console.error(err); }
    e.target.value = "";
  };

  const getWordStatus = (idx) => {
    if (idx === 0 || idx === 7) return "revealed";
    if (solved.find(s => s.wordIdx === idx)) return "solved";
    if (skipped.includes(idx)) return "skipped";
    if (idx === wordIdx && !chainDone) return "current";
    return "locked";
  };

  const wordClass = (status) => {
    const base = "relative w-full rounded-xl px-4 py-2 font-black text-base tracking-widest transition-all duration-300 flex items-center justify-center min-h-[3rem]";
    if (status === "revealed") return base + " bg-emerald-500/20 border-2 border-emerald-400/60 text-emerald-200";
    if (status === "solved")   return base + " bg-emerald-500/10 border border-emerald-400/40 text-emerald-300";
    if (status === "skipped")  return base + " bg-slate-800/60 border border-slate-600/40 text-slate-400 line-through";
    if (status === "current")  return base + " bg-teal-500/20 border-2 border-teal-400/50 text-white";
    return base + " bg-slate-900/40 border border-white/5 text-slate-700";
  };

  const arrowClass = (status) => {
    if (status === "revealed" || status === "solved") return "text-sm text-emerald-500/60";
    return "text-sm text-slate-700";
  };

  const timerBtnClass = (t) => {
    const base = "rounded-lg px-2 py-0.5 text-xs font-bold transition";
    if (timerDuration === t) return base + " bg-emerald-500 text-white";
    return base + " bg-white/10 text-slate-400";
  };

  const setupBtnClass = (t) => {
    const base = "rounded-xl px-4 py-2 text-sm font-bold transition";
    if (timerDuration === t) return base + " bg-emerald-500 text-white";
    return base + " bg-white/10 text-slate-300";
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">

      <AnimatePresence>
        {flashMode === "correct" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.25 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-30 bg-emerald-400" />
        )}
        {flashMode === "skip" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-30 bg-slate-400" />
        )}
      </AnimatePresence>

      <div className="w-full">
        <div className="flex items-center justify-between px-4 py-2">
          <button onClick={onBack} className="text-xs text-slate-400 hover:text-white transition">Menu</button>
          <div className="flex items-center gap-2">
            <span className="text-xl">&#128279;</span>
            <h1 className="text-lg font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              La Catena
            </h1>
            {competitionMode && (
              <span className="rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                {score} pt
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()}
              className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15 transition">
              <Upload className="h-3.5 w-3.5 inline mr-1" />Importa
            </button>
            <button onClick={reset} className="rounded-xl bg-white/10 p-1.5 hover:bg-white/15 transition">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-60" />
      </div>

      {!gameStarted && (
        <div className="flex flex-col items-center justify-center flex-1 px-4 gap-5">
          <div className="text-center">
            <div className="text-base font-black text-emerald-300 mb-0.5">Pronta per iniziare?</div>
            <div className="text-xs text-slate-400">Imposta il timer prima di partire</div>
          </div>
          <div className="text-5xl font-black tabular-nums text-emerald-400">{timerDuration}s</div>
          <div className="relative h-2 w-full max-w-xs rounded-full bg-slate-800 overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-full rounded-full bg-emerald-400" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {TIMER_OPTIONS.map(t => (
              <button key={t} onClick={() => { setTimerDuration(t); setTimeLeft(t); }}
                className={setupBtnClass(t)}>
                {t}s
              </button>
            ))}
          </div>
          <motion.button
            onClick={() => setGameStarted(true)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="w-full max-w-xs rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-bold text-white shadow-lg">
            Inizia
          </motion.button>
        </div>
      )}

      {gameStarted && (
        <div className="flex-1 flex flex-row items-center justify-center px-2 py-1 gap-2">

          {/* Timer a sinistra */}
          {!chainDone && (
            <div className="flex flex-col items-center gap-1 w-16 flex-shrink-0">
              <div className="relative w-2 flex-1 rounded-full bg-slate-800 overflow-hidden min-h-[200px]">
                <motion.div className="absolute bottom-0 left-0 w-full rounded-full"
                  style={{ backgroundColor: timerColor }}
                  animate={{ height: timerPct + "%" }}
                  transition={{ duration: 0.3 }} />
              </div>
              <span className="text-lg font-black tabular-nums" style={{ color: timerColor }}>{timeLeft}</span>
              <button onClick={() => setPaused(p => !p)}
                className={"rounded-lg px-1.5 py-1 text-[10px] font-bold transition w-full " + (paused ? "bg-amber-500 text-white" : "bg-white/10 text-slate-300")}>
                {paused ? "Go" : "Stop"}
              </button>
            </div>
          )}

          {/* Parole al centro */}
          <div className="flex flex-col items-center gap-0 flex-1">
            <div className="flex items-center justify-center mb-1">
              <span className="text-xs text-slate-500">{chainIdx + 1} / {chains.length}</span>
            </div>
            <div className="flex flex-col items-center gap-0 w-full">
            {chain.words.map((word, idx) => {
              const status = getWordStatus(idx);
              return (
                <React.Fragment key={idx}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={wordClass(status)}
                  >
                    {(status === "revealed" || status === "solved" || status === "skipped") && (
                      <span className="text-2xl">{word}</span>
                    )}
                    {status === "current" && (
                      <div className="flex items-center justify-center w-full">
                        <span className="text-white text-2xl">{revealed}</span>
                        <span className="flex items-center justify-center gap-2">{hidden.split("").map((_, i) => (<span key={i} className="inline-block w-6 h-1 bg-slate-400 rounded-sm" />))}</span>
                      </div>
                    )}
                    {status === "locked" && (
                      <span className="text-slate-700">{"_".repeat(Math.min(word.length, 8))}</span>
                    )}
                    {status === "solved" && (() => {
                      const s = solved.find(s => s.wordIdx === idx);
                      return s ? (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                          +{calcScore(s.lettersRevealed)}
                        </span>
                      ) : null;
                    })()}
                  </motion.div>
                  {idx < chain.words.length - 1 && (
                    <div className={arrowClass(status)}>|</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}



      {chainDone && (
        <div className="w-full px-4 pb-4">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-center">
            <div className="text-base font-black text-emerald-300 mb-1">Catena completata!</div>
            {competitionMode && (
              <div className="text-sm text-slate-300 mb-2">
                Punti: <span className="font-bold text-emerald-400">
                  {solved.reduce((acc, s) => acc + calcScore(s.lettersRevealed), 0)}
                </span>
              </div>
            )}
            <div className="text-xs text-slate-400 mb-3">
              {solved.length} indovinate - {skipped.length} saltate
            </div>
            <motion.button onClick={nextChain} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2 font-bold text-white">
              <ChevronRight className="h-5 w-5" /> Prossima catena
            </motion.button>
          </div>
        </div>
      )}

    </div>
  );
}

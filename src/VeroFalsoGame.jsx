import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { RotateCcw, Upload, CheckCircle, XCircle, ChevronRight, ArrowRight } from "lucide-react";
import { UI_TEXT } from "./texts/uiText";

const DEFAULT_ITEMS = [
  { text: "Gli struzzi nascondono la testa sotto la sabbia", answer: "F", explanation: "Non lo fanno mai. E' un mito popolare senza alcun fondamento.", category: "Natura", difficulty: "Facile" },
  { text: "I pipistrelli sono ciechi", answer: "F", explanation: "Vedono benissimo. Usano anche l'ecolocalizzazione per orientarsi al buio.", category: "Natura", difficulty: "Facile" },
  { text: "L'acqua calda congela piu' velocemente di quella fredda", answer: "V", explanation: "Si chiama effetto Mpemba. E' reale anche se i meccanismi non sono del tutto chiari.", category: "Scienza", difficulty: "Difficile" },
  { text: "I Vichinghi indossavano elmi con le corna", answer: "F", explanation: "Nessun elmo vichingo con le corna e' mai stato trovato. E' un'invenzione romantica dell'Ottocento.", category: "Storia", difficulty: "Facile" },
  { text: "Il miele non scade mai", answer: "V", explanation: "Il miele trovato nelle tombe egizie era ancora commestibile dopo 3000 anni.", category: "Curiosita'", difficulty: "Media" },
];

function normalizeAnswer(value) {
  const v = String(value ?? "").trim().toUpperCase();
  if (["V", "VERO", "TRUE", "T", "YES", "ADEVARAT"].includes(v)) return "V";
  if (["F", "FALSO", "FALSE", "NO", "FALS"].includes(v)) return "F";
  return null;
}

function normalizeDifficulty(value) {
  const d = String(value ?? "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f\u0326]/g, "");
  if (["facile","easy","usor"].includes(d)) return "Facile";
  if (["media","medium","mediu","moyen"].includes(d)) return "Media";
  if (["difficile","hard","dificil"].includes(d)) return "Difficile";
  return "Media";
}

function parseRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const header = rows[0].map(v => String(v ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_"));
  const idx = key => header.findIndex(h => h.includes(key));
  const textIdx    = idx("text") >= 0 ? idx("text") : idx("frase") >= 0 ? idx("frase") : idx("affermazion");
  const answerIdx  = idx("answer") >= 0 ? idx("answer") : idx("risposta") >= 0 ? idx("risposta") : idx("vero");
  const explIdx    = idx("explanation") >= 0 ? idx("explanation") : idx("spiegazione") >= 0 ? idx("spiegazione") : idx("explanat");
  const catIdx     = idx("category") >= 0 ? idx("category") : idx("categoria");
  const diffIdx    = idx("difficulty") >= 0 ? idx("difficulty") : idx("difficolt");
  if (textIdx < 0 || answerIdx < 0) return [];
  return rows.slice(1).map(row => ({
    text:        String(row?.[textIdx] ?? "").trim(),
    answer:      normalizeAnswer(row?.[answerIdx]),
    explanation: explIdx >= 0 ? String(row?.[explIdx] ?? "").trim() : "",
    category:    catIdx >= 0  ? String(row?.[catIdx]  ?? "").trim() : "",
    difficulty:  normalizeDifficulty(diffIdx >= 0 ? row?.[diffIdx] : "Media"),
  })).filter(r => r.text && r.answer);
}

export default function VeroFalsoGame({ onBack, selectedLanguage, competitionMode = false }) {
  const t = UI_TEXT[selectedLanguage];
  const [items, setItems]           = useState(DEFAULT_ITEMS);
  const [idx, setIdx]               = useState(0);
  const [revealed, setRevealed]     = useState(false);
  const [chosen, setChosen]         = useState(null); // "V" | "F" | null
  const [score, setScore]           = useState({ correct: 0, total: 0 });
  const [flashMode, setFlashMode]   = useState("none"); // "correct" | "wrong" | "none"
  const fileInputRef                = useRef(null);

  const current = items[idx] || DEFAULT_ITEMS[0];

  const reset = () => {
    setIdx(0);
    setRevealed(false);
    setChosen(null);
    setScore({ correct: 0, total: 0 });
    setFlashMode("none");
  };

  const goNext = () => {
    const next = idx + 1 < items.length ? idx + 1 : 0;
    setIdx(next);
    setRevealed(false);
    setChosen(null);
    setFlashMode("none");
  };

  const handleChoice = (choice) => {
    if (revealed) return;
    setChosen(choice);
    setRevealed(true);
    const correct = choice === current.answer;
    setFlashMode(correct ? "correct" : "wrong");
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
    setTimeout(() => setFlashMode("none"), 600);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
      const parsed = parseRows(rows);
      if (parsed.length > 0) {
        setItems(parsed);
        setIdx(0);
        setRevealed(false);
        setChosen(null);
        setScore({ correct: 0, total: 0 });
      }
    } catch (err) { console.error(err); }
    e.target.value = "";
  };

  const isCorrect = revealed && chosen === current.answer;
  const isWrong   = revealed && chosen !== current.answer;

  const diffColor = {
    Facile:    "bg-emerald-500/20 text-emerald-300",
    Media:     "bg-amber-500/20 text-amber-300",
    Difficile: "bg-rose-500/20 text-rose-300",
  }[current.difficulty] || "bg-slate-500/20 text-slate-300";

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">

      {/* Flash feedback */}
      <AnimatePresence>
        {flashMode === "correct" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.30 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-30 bg-emerald-400" />
        )}
        {flashMode === "wrong" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.30 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-30 bg-rose-500" />
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl">

        {/* Barra bottoni superiore */}
        <div className="w-full border-b border-white/10 mb-2">
          <div className="flex items-center justify-between px-4 py-2">
            <button onClick={onBack} className="text-xs text-slate-400 hover:text-white transition">
              {t.home.backToMenu}
            </button>
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15 transition">
                <Upload className="h-3.5 w-3.5 inline mr-1" />Importa
              </button>
              <button onClick={reset}
                className="rounded-xl bg-white/10 p-1.5 hover:bg-white/15 transition">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
          </div>
        </div>

        {/* Titolo con barre decorative */}
        <div className="w-full mb-3">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 opacity-60" />
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="text-2xl">🧠</span>
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Vero o Falso?
            </h1>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 opacity-60" />
        </div>

        {/* Progresso */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-slate-400">{idx + 1} / {items.length}</span>
          <div className="flex items-center gap-2">
            {current.category && (
              <span className="text-sm font-bold uppercase tracking-widest text-indigo-300">{current.category}</span>
            )}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${diffColor}`}>{current.difficulty}</span>
          </div>
          <span className="text-xs text-slate-400">✅ {score.correct}/{score.total}</span>
        </div>

        {/* Card affermazione */}
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-blue-600/20 to-violet-500/20 p-8 text-center mb-6 min-h-[160px] flex items-center justify-center"
        >
          <p className="text-2xl font-semibold leading-snug tracking-wide">{current.text}</p>
        </motion.div>

        {/* Pulsanti Vero / Falso */}
        {!revealed && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.button
              onClick={() => handleChoice("V")}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-3 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/40 py-6 text-2xl font-black text-emerald-300 hover:bg-emerald-500/30 transition shadow-lg">
              <CheckCircle className="h-8 w-8" /> VERO
            </motion.button>
            <motion.button
              onClick={() => handleChoice("F")}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-3 rounded-3xl bg-rose-500/20 border-2 border-rose-400/40 py-6 text-2xl font-black text-rose-300 hover:bg-rose-500/30 transition shadow-lg">
              <XCircle className="h-8 w-8" /> FALSO
            </motion.button>
          </div>
        )}

        {/* Risultato */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`rounded-3xl border-2 p-6 mb-6 ${
                isCorrect
                  ? "border-emerald-400/50 bg-emerald-500/15"
                  : "border-rose-400/50 bg-rose-500/15"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {isCorrect
                  ? <CheckCircle className="h-7 w-7 text-emerald-400 flex-shrink-0" />
                  : <XCircle className="h-7 w-7 text-rose-400 flex-shrink-0" />
                }
                <span className={`text-2xl font-black ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCorrect ? "Corretto!" : `Sbagliato! Era ${current.answer === "V" ? "VERO" : "FALSO"}`}
                </span>
              </div>
              {current.explanation && (
                <p className="text-sm text-slate-200 leading-relaxed">{current.explanation}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsante Avanti */}
        {revealed && (
          <motion.button
            onClick={goNext}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400 transition">
            <ArrowRight className="h-5 w-5" /> Prossima domanda
          </motion.button>
        )}
      </div>
    </div>
  );
}

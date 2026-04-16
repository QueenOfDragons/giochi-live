import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ArrowRight, Heart, Timer } from "lucide-react";
import { UI_TEXT } from "./texts/uiText";

const MAX_HEARTS = 7;

const CATEGORIES = {
  it: [
    { id: "free",     label: "🎯 Libera",       hint: "qualsiasi parola" },
    { id: "animals",  label: "🐾 Animali",       hint: "solo animali" },
    { id: "cities",   label: "🏙️ Città",         hint: "solo città" },
    { id: "food",     label: "🍕 Cibo",           hint: "solo cibi e bevande" },
    { id: "nature",   label: "🌿 Natura",         hint: "piante, fiori, paesaggi" },
    { id: "sport",    label: "⚽ Sport",          hint: "sport e attività fisiche" },
    { id: "names",    label: "👤 Nomi propri",    hint: "solo nomi di persona" },
    { id: "objects",  label: "📦 Oggetti",        hint: "oggetti di uso comune" },
  ],
  en: [
    { id: "free",     label: "🎯 Free",           hint: "any word" },
    { id: "animals",  label: "🐾 Animals",        hint: "animals only" },
    { id: "cities",   label: "🏙️ Cities",         hint: "cities only" },
    { id: "food",     label: "🍕 Food",            hint: "food and drinks" },
    { id: "nature",   label: "🌿 Nature",          hint: "plants, flowers, landscapes" },
    { id: "sport",    label: "⚽ Sport",           hint: "sports and activities" },
    { id: "names",    label: "👤 Names",           hint: "first names only" },
    { id: "objects",  label: "📦 Objects",         hint: "everyday objects" },
  ],
  fr: [
    { id: "free",     label: "🎯 Libre",           hint: "n'importe quel mot" },
    { id: "animals",  label: "🐾 Animaux",         hint: "animaux seulement" },
    { id: "cities",   label: "🏙️ Villes",          hint: "villes seulement" },
    { id: "food",     label: "🍕 Nourriture",      hint: "aliments et boissons" },
    { id: "nature",   label: "🌿 Nature",           hint: "plantes, fleurs, paysages" },
    { id: "sport",    label: "⚽ Sport",            hint: "sports et activités" },
    { id: "names",    label: "👤 Prénoms",          hint: "prénoms seulement" },
    { id: "objects",  label: "📦 Objets",           hint: "objets du quotidien" },
  ],
  ro: [
    { id: "free",     label: "🎯 Liber",            hint: "orice cuvânt" },
    { id: "animals",  label: "🐾 Animale",          hint: "numai animale" },
    { id: "cities",   label: "🏙️ Orașe",            hint: "numai orașe" },
    { id: "food",     label: "🍕 Mâncare",          hint: "mâncare și băuturi" },
    { id: "nature",   label: "🌿 Natură",           hint: "plante, flori, peisaje" },
    { id: "sport",    label: "⚽ Sport",            hint: "sporturi și activități" },
    { id: "names",    label: "👤 Nume",             hint: "numai prenume" },
    { id: "objects",  label: "📦 Obiecte",          hint: "obiecte de zi cu zi" },
  ],
};

const TIMER_OPTIONS = [30, 45, 60, 90];

function normalizeFirst(word) {
  return word.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")[0] || "";
}

function getLastLetter(word) {
  const clean = word.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return clean[clean.length - 1] || "";
}

// ─── Barra timer animata ──────────────────────────────────────────────────
function TimerBar({ timeLeft, totalTime, isUrgent }) {
  const pct = (timeLeft / totalTime) * 100;
  const color = isUrgent ? "bg-rose-500" : pct > 50 ? "bg-emerald-400" : "bg-amber-400";

  return (
    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color} transition-colors duration-300`}
        style={{ width: `${pct}%` }}
        animate={isUrgent ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
        transition={isUrgent ? { duration: 0.4, repeat: Infinity } : {}}
      />
    </div>
  );
}

// ─── Card parola nella catena ─────────────────────────────────────────────
function WordCard({ word, index, isLatest, requiredLetter }) {
  const last = getLastLetter(word);
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
        isLatest
          ? "border-emerald-400/40 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <span className="text-xs font-bold text-slate-500 w-5 text-right">{index}</span>
      <span className={`font-bold ${isLatest ? "text-white text-base" : "text-slate-300 text-sm"}`}>
        {word}
      </span>
      <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-lg bg-white/10 text-cyan-300 uppercase">
        →{last}
      </span>
    </motion.div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────
export default function WordChainGame({ onBack, selectedLanguage }) {
  const t = UI_TEXT[selectedLanguage];
  const lang = selectedLanguage || "it";
  const wt = t.wordchain || {};
  const categories = CATEGORIES[lang] || CATEGORIES.it;

  // ─ Setup
  const [timerDuration, setTimerDuration] = useState(45);
  const [categoryId, setCategoryId]       = useState("free");
  const [status, setStatus]               = useState("setup"); // setup | playing | lost

  // ─ Gioco
  const [chain, setChain]           = useState([]);
  const [hearts, setHearts]         = useState(MAX_HEARTS);
  const [inputWord, setInputWord]   = useState("");
  const [timeLeft, setTimeLeft]     = useState(45);
  const [heartBurst, setHeartBurst] = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");
  const [shake, setShake]           = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);

  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  const currentCategory = categories.find(c => c.id === categoryId) || categories[0];
  const requiredLetter  = chain.length > 0 ? getLastLetter(chain[chain.length - 1]) : null;
  const isUrgent        = timeLeft <= 10;

  // ─ Avvia timer ────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimeLeft(timerDuration);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // tempo scaduto — perde un cuore
          setHearts(h => {
            const next = h - 1;
            if (next <= 0) {
              setStatus("lost");
            }
            return Math.max(0, next);
          });
          setHeartBurst(true);
          setFlashWrong(true);
          setTimeout(() => setHeartBurst(false), 600);
          setTimeout(() => setFlashWrong(false), 300);
          // riparte il timer
          setTimeLeft(timerDuration);
          return timerDuration;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerDuration]);

  // ─ Avvia round ────────────────────────────────────────────────────────
  const startRound = () => {
    setChain([]);
    setHearts(MAX_HEARTS);
    setInputWord("");
    setErrorMsg("");
    setStatus("playing");
    setTimeLeft(timerDuration);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    if (status === "playing") {
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // ─ Reset ──────────────────────────────────────────────────────────────
  const reset = () => {
    clearInterval(timerRef.current);
    setStatus("setup");
    setChain([]);
    setHearts(MAX_HEARTS);
    setInputWord("");
    setErrorMsg("");
  };

  // ─ Conferma parola ────────────────────────────────────────────────────
  const submitWord = () => {
    if (status !== "playing") return;
    const word = inputWord.trim();
    if (!word) return;

    // Controlla lettera iniziale
    if (requiredLetter && normalizeFirst(word) !== requiredLetter) {
      setErrorMsg(wt.wrongLetter
        ? wt.wrongLetter.replace("{letter}", requiredLetter.toUpperCase())
        : `Deve iniziare con "${requiredLetter.toUpperCase()}"!`);
      setShake(true);
      setFlashWrong(true);
      setTimeout(() => setShake(false), 400);
      setTimeout(() => setFlashWrong(false), 300);
      setInputWord("");
      return;
    }

    // Controlla duplicati
    if (chain.map(w => w.toLowerCase()).includes(word.toLowerCase())) {
      setErrorMsg(wt.duplicate || "Parola già usata!");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setInputWord("");
      return;
    }

    // Parola accettata
    setErrorMsg("");
    setChain(prev => [...prev, word]);
    setInputWord("");
    startTimer(); // resetta il timer
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Invio da tastiera
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") {
        if (status === "setup") startRound();
        else if (status === "playing") submitWord();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, inputWord, chain, requiredLetter]);

  const heartsArray = Array.from({ length: MAX_HEARTS }, (_, i) => i < hearts);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">

      {/* Sfondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-600/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-600/15 blur-3xl" />
      </div>

      {/* Flash errore */}
      <AnimatePresence>
        {flashWrong && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-red-500 z-0" />
        )}
      </AnimatePresence>
      {/* Flash sconfitta */}
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
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {wt.title || "Catena di Parole"}
          </h1>
          <button onClick={reset}
            className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15 transition">
            <RotateCcw className="h-3 w-3" />
            {wt.reset || "Reset"}
          </button>
        </div>

        {/* ─ SETUP ──────────────────────────────────────────────────────── */}
        {status === "setup" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl space-y-5"
          >
            {/* Categoria */}
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                {wt.category || "Categoria"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setCategoryId(cat.id)}
                    className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                      categoryId === cat.id
                        ? "border border-emerald-400/40 bg-emerald-500/15 text-white font-semibold"
                        : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div>{cat.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{cat.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                ⏱ {wt.timerLabel || "Secondi per parola"}
              </p>
              <div className="flex gap-2">
                {TIMER_OPTIONS.map(sec => (
                  <button key={sec} onClick={() => setTimerDuration(sec)}
                    className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                      timerDuration === sec
                        ? "bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/15"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <motion.button onClick={startRound}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-base font-bold text-white shadow-lg shadow-emerald-500/30"
            >
              {wt.start || "🔗 Inizia la catena!"}
            </motion.button>
          </motion.div>
        )}

        {/* ─ PLAYING / LOST ─────────────────────────────────────────────── */}
        {status !== "setup" && (
          <>
            {/* Info round: categoria + cuori */}
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">
                  {currentCategory.label}
                  {chain.length > 0 && (
                    <span className="ml-2 font-bold text-white">
                      {chain.length} {wt.words || "parole"}
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-400">
                  {chain.length > 0 && (
                    <span className="font-bold text-cyan-300 text-sm uppercase tracking-widest">
                      → {requiredLetter?.toUpperCase()}
                    </span>
                  )}
                </span>
              </div>
              {/* Cuori */}
              <div className="flex gap-1 flex-wrap mb-2">
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
              {/* Timer bar */}
              {status === "playing" && (
                <div className="flex items-center gap-2">
                  <Timer className={`h-3 w-3 flex-shrink-0 ${isUrgent ? "text-rose-400" : "text-slate-400"}`} />
                  <TimerBar timeLeft={timeLeft} totalTime={timerDuration} isUrgent={isUrgent} />
                  <span className={`text-xs font-black w-6 text-right ${isUrgent ? "text-rose-400" : "text-slate-400"}`}>
                    {timeLeft}
                  </span>
                </div>
              )}
            </div>

            {/* Input parola */}
            {status === "playing" && (
              <motion.div
                animate={shake ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                {/* Lettera richiesta */}
                {requiredLetter && (
                  <div className="mb-2 text-center">
                    <span className="text-xs text-slate-400">{wt.mustStartWith || "Deve iniziare con"} </span>
                    <span className="text-2xl font-black text-cyan-300 uppercase">{requiredLetter}</span>
                  </div>
                )}
                {!requiredLetter && (
                  <div className="mb-2 text-center text-xs text-slate-400">
                    {wt.firstWord || "Inserisci la prima parola!"}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputWord}
                    onChange={e => { setInputWord(e.target.value); setErrorMsg(""); }}
                    placeholder={requiredLetter ? `${requiredLetter.toUpperCase()}...` : "..."}
                    className="flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder:text-slate-600 uppercase"
                    autoComplete="off"
                    autoCapitalize="words"
                  />
                  <motion.button
                    onClick={submitWord}
                    disabled={!inputWord.trim()}
                    whileHover={inputWord.trim() ? { scale: 1.05 } : {}}
                    whileTap={inputWord.trim() ? { scale: 0.95 } : {}}
                    className={`rounded-xl px-5 py-2 text-sm font-bold transition ${
                      !inputWord.trim()
                        ? "bg-white/5 text-slate-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30"
                    }`}
                  >
                    ✓ OK
                  </motion.button>
                </div>

                {/* Messaggio errore */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 text-center text-xs font-semibold text-rose-400"
                    >
                      {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Sconfitta */}
            <AnimatePresence>
              {status === "lost" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-center"
                >
                  <div className="text-lg font-black text-rose-400 mb-1">
                    {wt.lost || "💔 Fine della catena!"}
                  </div>
                  <div className="text-sm text-slate-300">
                    {wt.reached || "Raggiunte"} <span className="font-black text-white text-xl">{chain.length}</span> {wt.words || "parole"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottoni fine partita */}
            {status === "lost" && (
              <div className="mb-3 flex justify-center gap-3">
                <motion.button onClick={startRound}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30"
                >
                  <ArrowRight className="h-4 w-4" />
                  {wt.playAgain || "Rigioca"}
                </motion.button>
                <motion.button onClick={reset}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  {wt.changeSettings || "Impostazioni"}
                </motion.button>
              </div>
            )}

            {/* Catena parole — le più recenti in cima */}
            {chain.length > 0 && (
              <div className="space-y-1.5">
                {[...chain].reverse().map((word, i) => (
                  <WordCard
                    key={chain.length - 1 - i}
                    word={word}
                    index={chain.length - i}
                    isLatest={i === 0}
                    requiredLetter={requiredLetter}
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

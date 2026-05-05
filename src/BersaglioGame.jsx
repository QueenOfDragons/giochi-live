import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ArrowRight, Heart } from "lucide-react";
import { UI_TEXT } from "./texts/uiText";

const MAX_HEARTS = 7;
const STORAGE_KEY_PREFIX = "bersaglio_percorsi_";

function loadPercorsi(language) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + language);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
}

function savePercorsi(language, data) {
  try { localStorage.setItem(STORAGE_KEY_PREFIX + language, JSON.stringify(data)); } catch (e) {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function parseExcel(file) {
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const percorsi = [];
  for (const row of rows) {
    const parole = row.map(c => String(c || "").trim().toUpperCase()).filter(Boolean);
    if (parole.length >= 3) percorsi.push(parole);
  }
  return percorsi;
}

export default function BersaglioGame({ onBack, selectedLanguage }) {
  const t = UI_TEXT[selectedLanguage];
  const bt = t.bersaglio || {};

  const [percorsi, setPercorsi]           = useState(() => loadPercorsi(selectedLanguage));
  const [percorsoIdx, setPercorsoIdx]     = useState(0);
  const [status, setStatus]               = useState(() => loadPercorsi(selectedLanguage).length > 0 ? "playing" : "empty");
  const [percorso, setPercorso]           = useState([]);
  const [paroleDisplay, setParoleDisplay] = useState([]);
  const [catena, setCatena]               = useState([]);
  const [hearts, setHearts]               = useState(MAX_HEARTS);
  const [heartBurst, setHeartBurst]       = useState(false);
  const [shakeWord, setShakeWord]         = useState(null);
  const [gameStatus, setGameStatus]       = useState("playing");

  const fileRef = useRef(null);

  // Quando cambia la lingua, carica i percorsi salvati per quella lingua
  useEffect(() => {
    const loaded = loadPercorsi(selectedLanguage);
    setPercorsi(loaded);
    setPercorsoIdx(0);
    setStatus(loaded.length > 0 ? "playing" : "empty");
    if (loaded.length > 0) initPercorso(loaded, 0);
  }, [selectedLanguage]);

  function initPercorso(pList, idx) {
    const p = pList[idx] || [];
    setPercorso(p);
    setParoleDisplay(shuffle(p));
    setCatena([]);
    setHearts(MAX_HEARTS);
    setHeartBurst(false);
    setShakeWord(null);
    setGameStatus("playing");
  }

  useEffect(() => {
    if (percorsi.length > 0) {
      setStatus("playing");
      initPercorso(percorsi, percorsoIdx);
    }
  }, [percorsi, percorsoIdx]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = await parseExcel(file);
      if (parsed.length === 0) return;
      setPercorsi(parsed);
      savePercorsi(selectedLanguage, parsed);
      setPercorsoIdx(0);
    } catch (err) {}
    e.target.value = "";
  };

  const handleWordClick = (parola) => {
    if (gameStatus !== "playing") return;
    const nextIdx = catena.length;
    // La prima parola è già fissa, si parte dalla seconda
    const expected = percorso[nextIdx + 1];
    if (!expected) return;

    if (parola === expected) {
      const newCatena = [...catena, parola];
      setCatena(newCatena);
      if (newCatena.length === percorso.length - 1) {
        setGameStatus("won");
      }
    } else {
      const newHearts = hearts - 1;
      setHearts(newHearts);
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 500);
      setShakeWord(parola);
      setTimeout(() => setShakeWord(null), 400);
      if (newHearts <= 0) setGameStatus("lost");
    }
  };

  const nextPercorso = () => {
    const next = (percorsoIdx + 1) % percorsi.length;
    setPercorsoIdx(next);
  };

  const reset = () => initPercorso(percorsi, percorsoIdx);

  const firstWord = percorso[0] || "";
  const lastWord  = percorso[percorso.length - 1] || "";
  const usedWords = new Set([firstWord, ...catena]);
  const currentWord = catena.length === 0 ? firstWord : catena[catena.length - 1];

  const heartsArr = Array.from({ length: MAX_HEARTS }, (_, i) => i < hearts);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-yellow-600/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-orange-600/15 blur-3xl" />
      </div>

      <AnimatePresence>
        {gameStatus === "won" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-yellow-400 z-0" />
        )}
        {gameStatus === "lost" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-red-500 z-0" />
        )}
      </AnimatePresence>

      {/* Barra bottoni superiore */}
      <div className="relative z-10 w-full border-b border-white/10 mb-2">
        <div className="flex items-center justify-between px-4 py-2">
          <button onClick={onBack} className="text-xs text-slate-400 hover:text-white transition">
            {t.home?.backToMenu || "← Menu"}
          </button>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15 transition">
              📥 {bt.importBtn || "Importa"}
            </button>
            <button onClick={reset}
              className="rounded-xl bg-white/10 p-1.5 hover:bg-white/15 transition">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {/* Titolo con barra decorativa */}
      <div className="relative z-10 w-full mb-3">
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-60" />
        <div className="flex items-center justify-center gap-2 py-3">
          <span className="text-2xl">🎯</span>
          <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            {bt.title || "Il Bersaglio"}
          </h1>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-60" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-2">

        {/* Stato vuoto */}
        {status === "empty" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl"
          >
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-slate-300 mb-2 font-semibold">{bt.emptyTitle || "Nessun percorso caricato"}</p>
            <p className="text-xs text-slate-500 mb-6">{bt.emptyDesc || "Importa un file Excel con i tuoi percorsi"}</p>
            <button onClick={() => fileRef.current?.click()}
              className="rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-3 font-bold text-white shadow-lg">
              📥 {bt.importBtn || "Importa file Excel"}
            </button>
          </motion.div>
        )}

        {/* Gioco */}
        {status === "playing" && percorso.length > 0 && (
          <>
            {/* Info + cuori */}
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">
                  {bt.path || "Percorso"}{" "}
                  <span className="font-bold text-white">{percorsoIdx + 1}</span>
                  <span className="text-slate-600"> / {percorsi.length}</span>
                </span>
                <span className="text-xs font-bold text-cyan-300">
                  {catena.length} / {percorso.length - 1}
                </span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {heartsArr.map((alive, i) => (
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

            {/* Parola corrente */}
            {gameStatus === "playing" && (
              <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">
                  {catena.length === 0 ? (bt.startFrom || "Parti da") : (bt.nextFrom || "Collegata a")}
                </div>
                <div className="text-2xl font-black text-emerald-300">{currentWord}</div>
              </div>
            )}

            {/* Griglia parole — max 3 per riga */}
            <div className="mb-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl">
              <div className="grid grid-cols-3 gap-2">
                {paroleDisplay.map((parola, i) => {
                  const isFirst  = parola === firstWord;
                  const isLast   = parola === lastWord;
                  const isUsed   = usedWords.has(parola) && parola !== lastWord;
                  const isWon    = gameStatus === "won" && isLast;
                  const isShaking = shakeWord === parola;
                  const clickable = !isFirst && !isUsed && gameStatus === "playing";

                  return (
                    <motion.button
                      key={i}
                      onClick={() => clickable && handleWordClick(parola)}
                      animate={isShaking ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={clickable ? { scale: 1.04, y: -2 } : {}}
                      whileTap={clickable ? { scale: 0.95 } : {}}
                      className={`
                        rounded-xl px-1 py-1.5 text-lg font-bold border transition select-none text-center w-full
                        ${isWon
                          ? "bg-yellow-400 border-yellow-300 text-black shadow-lg shadow-yellow-400/50"
                          : isFirst
                          ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-300 cursor-default ring-2 ring-emerald-400/30"
                          : isLast
                          ? "bg-orange-500/25 border-orange-400/50 text-orange-300 cursor-pointer ring-2 ring-orange-400/30"
                          : isUsed
                          ? "bg-white/5 border-white/10 text-slate-600 cursor-default line-through decoration-slate-600"
                          : gameStatus !== "playing"
                          ? "bg-white/5 border-white/10 text-slate-500 cursor-default"
                          : "bg-white/10 border-white/20 text-white cursor-pointer hover:bg-white/20 hover:border-white/40"
                        }
                      `}
                    >
                      {parola}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Legenda */}
            <div className="mb-3 flex justify-center gap-5 text-[10px] text-slate-500">
              <span><span className="text-emerald-400 font-bold">●</span> {bt.legendStart || "Partenza"}</span>
              <span><span className="text-orange-400 font-bold">●</span> {bt.legendEnd || "Bersaglio"}</span>
              <span><span className="text-slate-600 font-bold">●</span> {bt.legendUsed || "Già usata"}</span>
            </div>

            {/* Vittoria / Sconfitta */}
            <AnimatePresence>
              {gameStatus === "won" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="mb-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-center"
                >
                  <div className="text-3xl mb-1">🎯</div>
                  <div className="text-xl font-black text-yellow-400">{bt.won || "Bersaglio centrato!"}</div>
                </motion.div>
              )}
              {gameStatus === "lost" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="mb-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-center"
                >
                  <div className="text-lg font-black text-rose-400 mb-2">{bt.lost || "💔 Cuori esauriti!"}</div>
                  <div className="text-[10px] text-slate-500 mb-1">{bt.solutionLabel || "Il percorso corretto era"}:</div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {percorso.map((p, i) => (
                      <span key={i} className="text-xs font-bold text-slate-300">
                        {p}{i < percorso.length - 1 ? <span className="text-slate-600"> →</span> : null}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prossimo percorso */}
            {gameStatus !== "playing" && (
              <div className="flex justify-center">
                <motion.button onClick={nextPercorso}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-yellow-500/30"
                >
                  <ArrowRight className="h-4 w-4" />
                  {bt.nextPath || "Prossimo percorso"}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import twemoji from "twemoji";
import { UI_TEXT } from "./texts/uiText";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Eye,
  EyeOff,
  Heart,
  Monitor,
  RotateCcw,
  Shuffle,
  Upload,
  Volume2,
  VolumeX,
  PanelsTopLeft,
} from "lucide-react";

const DEFAULT_ITEMS = [
  { text: "Chat silenziosa", hint: "Tutti leggono… nessuno scrive 👀", difficulty: "Media" },
  { text: "Friendzone", hint: "Ti vuole… ma non così 😭", difficulty: "Facile" },
  { text: "Visualizza e non risponde", hint: "Ti legge… e sceglie di no 😏", difficulty: "Difficile" },
  { text: "Pensieri notturni", hint: "Di giorno ok… di notte no 😶‍🌫️", difficulty: "Media" },
];

const DIFFICULTY_HEARTS = {
  Facile: 7,
  Media: 8,
  Difficile: 10,
};

const ALLOWED_DIFFICULTIES = ["Facile", "Media", "Difficile"];
const LETTER_REGEX = /[A-Za-zÀ-ÖØ-öø-ÿ]/;

const KEYBOARD_LAYOUTS = {
  it: [
    ["a","b","c","d","e","f","g","h","i","l","m","n","o"],
    ["p","q","r","s","t","u","v","z","à","è","é","ì","ò","ù"]
  ],
  en: [
    ["a","b","c","d","e","f","g","h","i","j","k","l","m"],
    ["n","o","p","q","r","s","t","u","v","w","x","y","z"]
  ],
  ro: [
    ["a","b","c","d","e","f","g","h","i","j","k","l","m"],
    ["n","o","p","q","r","s","t","u","v","z","ă","â","î","ș","ț"]
  ],
  fr: [
    ["a","b","c","d","e","f","g","h","i","j","k","l","m"],
    ["n","o","p","q","r","s","t","u","v","w","x","y","z","à","â","ç","é","è","ê","ë","î","ï","ô","ù","û"]
  ]
};

function decodeExcelText(value) {
  return String(value ?? "")
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .trim();
}

function normalizeDifficultyLabel(value) {
  const d = String(value ?? "").trim().toLowerCase();

  if (["facile", "easy", "ușor", "usor"].includes(d)) return "Facile";
  if (["media", "medium", "mediu"].includes(d)) return "Media";
  if (["difficile", "hard", "dificil"].includes(d)) return "Difficile";

  return "Media";
}

function parseImportedRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];

  const header = rows[0].map((v) => normalizeHeaderValue(v));

  const findColumnIndex = (header, keywords) => {
    return header.findIndex((h) =>
      keywords.some((k) => h.includes(k))
    );
  };

  const textIdx = findColumnIndex(header, [
    "text",
    "parola",
    "frase",
    "word",
    "phrase",
    "soluzione",
    "answer",
    "cuvant",
    "expresie",
    "raspuns",
  ]);

  const hintIdx = findColumnIndex(header, [
    "hint",
    "indizio",
    "aiuto",
    "clue",
    "suggerimento",
    "indicazione",
    "indiciu",
    "ajutor",
  ]);

  const difficultyIdx = findColumnIndex(header, [
    "difficulty",
    "difficolta",
    "livello",
    "level",
    "dificultate",
  ]);

  if (textIdx === -1 || hintIdx === -1) {
    console.warn("Colonne non riconosciute:", header);
    return [];
  }

  return rows
    .slice(1)
    .map((row) => ({
      text: decodeExcelText(row?.[textIdx] ?? ""),
      hint: decodeExcelText(row?.[hintIdx] ?? ""),
      difficulty: decodeExcelText(difficultyIdx >= 0 ? row?.[difficultyIdx] ?? "Media" : "Media") || "Media",
    }))
    .filter((item) => item.text && item.hint)
    .map((item) => ({
      ...item,
      difficulty: normalizeDifficultyLabel(item.difficulty),
    }));
}

function normalizeHeaderValue(value) {
  return String(value ?? "")
    .normalize("NFD") // rimuove accenti
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeChar(char) {
  return String(char ?? "")
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getUniqueLetters(text) {
  const set = new Set();
  for (const ch of String(text ?? "")) {
    if (LETTER_REGEX.test(ch)) set.add(normalizeChar(ch));
  }
  return [...set];
}

function maskCharacters(text, guessed) {
  return [...String(text ?? "")].map((ch, idx) => {
    if (ch === " ") return { type: "space", value: " ", key: idx };
    if (!LETTER_REGEX.test(ch)) return { type: "fixed", value: ch, key: idx };

    const visible = guessed.has(normalizeChar(ch));
    return {
      type: "letter",
      value: visible ? ch.toUpperCase() : "",
      hidden: ch.toUpperCase(),
      key: idx,
    };
  });
}

function runSelfChecks() {
  const parsed = parseImportedRows([
    ["text", "hint", "difficulty"],
    ["Friendzone", "Ti vuole… ma non così 😭", "Facile"],
    ["", "vuoto", "Media"],
    ["Amore tossico", "Ti distrugge… ma torni sempre 😶", "Nope"],
  ]);
  console.assert(parsed.length === 2, "Import: numero righe valide errato");
  console.assert(parsed[0].difficulty === "Facile", "Import: difficulty valida persa");
  console.assert(parsed[1].difficulty === "Media", "Import: fallback difficulty non applicato");
  console.assert(DIFFICULTY_HEARTS.Difficile > DIFFICULTY_HEARTS.Facile, "Difficulty hearts: difficile deve avere più cuori di facile");

  const masked = maskCharacters("Ciao!", new Set(["c", "a"]));
  console.assert(masked[0].value === "C", "Mask: C non visibile");
  console.assert(masked[4].value === "!", "Mask: punteggiatura non mantenuta");
}

if (typeof window !== "undefined") runSelfChecks();

function RobotPiece({ show, className = "", children, exitY = 120, exitRotate = 28, exitScale = 0.7, duration = 0.35 }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.84, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: exitY, rotate: exitRotate, scale: exitScale }}
          transition={{ duration }}
          className={className}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CuteRobotFace({ state = "idle" }) {
  const isSad = state === "lose";
  const isHappy = state === "win";

  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-full border-[2px] border-sky-400 bg-gradient-to-br from-orange-200 to-orange-300">

      {/* occhi */}
      <div className="absolute top-[14px] flex gap-3">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            animate={
              isHappy
                ? { scaleY: [1, 0.4, 1] }
                : { scaleY: [1, 0.1, 1] }
            }
            transition={{
              duration: isHappy ? 0.6 : 2.5,
              repeat: Infinity,
              repeatDelay: isHappy ? 0.8 : 2
            }}
            className="relative h-2.5 w-2.5 rounded-full bg-sky-800"
          >
            {!isSad && (
              <div className="absolute top-[1px] left-[1px] h-1 w-1 rounded-full bg-white" />
            )}
          </motion.div>
        ))}
      </div>

      {/* bocca */}
      <div className="absolute bottom-[9px] flex justify-center w-full">
        <div
          className={`
      border-b-[3px] border-sky-700
      ${isSad ? "w-5 h-2 border-t-0 border-b-2 rounded-b-full" : ""}
      ${isHappy ? "w-6 h-3 border-t-0 border-b-2 rounded-b-full" : ""}
      ${!isSad && !isHappy ? "w-5 h-2 border-t-0 border-b-2 rounded-b-full" : ""}
    `}
        />
      </div>

      {/* guanciotte win */}
      {isHappy && (
        <>
          <div className="absolute left-[6px] bottom-[10px] h-2 w-2 rounded-full bg-pink-300 opacity-80" />
          <div className="absolute right-[6px] bottom-[10px] h-2 w-2 rounded-full bg-pink-300 opacity-80" />
        </>
      )}
    </div>
  );
}

function RobotArena({ wrongCount, maxHearts, isLost, isWon }) {
  const phase1 = Math.max(1, maxHearts - 6);
  const phase2 = Math.max(2, maxHearts - 5);
  const phase3 = Math.max(3, maxHearts - 4);
  const phase4 = Math.max(4, maxHearts - 3);
  const phase5 = Math.max(5, maxHearts - 2);
  const phase6 = Math.max(6, maxHearts - 1);
  const phase7 = maxHearts;

  const bodyVisible = wrongCount < phase5;
  const leftArmVisible = wrongCount < phase1;
  const rightArmVisible = wrongCount < phase2;
  const leftLegVisible = wrongCount < phase3;
  const rightLegVisible = wrongCount < phase4;
  const earsVisible = wrongCount < phase5;
  const antennaVisible = wrongCount < phase6;
  const headVisible = wrongCount < phase7;

  const leftArmOuter = isWon
    ? "absolute left-[6px] top-[58px] h-[34px] w-[30px]"
    : "absolute left-[8px] top-[62px] h-[34px] w-[28px]";

  const rightArmOuter = isWon
    ? "absolute right-[6px] top-[58px] h-[34px] w-[30px]"
    : "absolute right-[8px] top-[62px] h-[34px] w-[28px]";

  return (
    <motion.div
      animate={
        isWon
          ? { scale: [1, 1.03, 1], rotate: [0, 1, -1, 0], y: [0, -2, 0] }
          : isLost
            ? { y: 0, rotate: 0 }
            : { y: [0, -2, 0] }
      }
      transition={
        isWon
          ? { duration: 1.2, repeat: Infinity }
          : isLost
            ? { duration: 0.2 }
            : { duration: 2.2, repeat: Infinity }
      }
      className="relative flex h-[118px] items-center justify-center sm:h-[140px]"
    >
      <motion.div
        animate={isWon ? { opacity: [0.18, 0.35, 0.18], scale: [1, 1.04, 1] } : { opacity: 0.18 }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute bottom-2 h-3 w-20 rounded-full bg-cyan-400/25 blur-md"
      />

      <div className="relative h-[112px] w-[86px] sm:h-[132px] sm:w-[100px]">
        <RobotPiece
          show={antennaVisible && !isLost}
          className="absolute left-[38px] top-[1px] h-4 w-3 sm:left-[45px] sm:h-5"
          exitY={80}
          exitRotate={18}
        >
          <div className="absolute left-[5px] top-1 h-3.5 w-[2px] rounded-full bg-lime-400 sm:h-4" />
          <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </RobotPiece>

        <RobotPiece
          show={headVisible && !isLost}
          className="absolute left-[14px] top-[6px] h-[40px] w-[58px] sm:left-[18px] sm:top-[8px] sm:h-[46px] sm:w-[64px]"
          exitY={104}
          exitRotate={300}
          exitScale={0.9}
          duration={1.15}
        >
          <CuteRobotFace state={isWon ? "win" : "idle"} />
        </RobotPiece>

        <AnimatePresence>
          {isLost ? (
            <motion.div
              initial={{ opacity: 1, x: 0, y: 6, rotate: 0 }}
              animate={{ opacity: 1, x: [0, 8, 18, 30], y: [6, 58, 88, 98], rotate: [0, 80, 180, 300] }}
              transition={{ duration: 1.25, ease: "easeInOut" }}
              className="absolute left-[14px] top-[6px] h-[40px] w-[58px] sm:left-[18px] sm:top-[8px] sm:h-[46px] sm:w-[64px]"
            >
              <CuteRobotFace state="lose" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <RobotPiece
          show={earsVisible}
          className="absolute left-[9px] top-[28px] h-3.5 w-3.5 rounded-full border-[2px] border-sky-500 bg-sky-300 sm:left-[11px] sm:top-[33px]"
          exitY={70}
          exitRotate={-25}
        />
        <RobotPiece
          show={earsVisible}
          className="absolute right-[9px] top-[28px] h-3.5 w-3.5 rounded-full border-[2px] border-sky-500 bg-sky-300 sm:right-[11px] sm:top-[33px]" exitY={70}
          exitRotate={25}
        />

        <RobotPiece
          show={bodyVisible}
          className="absolute left-[20px] top-[48px] h-[34px] w-[42px] sm:left-[24px] sm:top-[58px] sm:h-[38px] sm:w-[48px]"
          exitY={82}
          exitRotate={20}
        >
          <div className="absolute inset-0 rounded-[16px] border-[2px] border-sky-400 bg-gradient-to-br from-orange-200 to-orange-300 shadow-md" />
          F <div className="absolute left-1/2 top-[5px] -translate-x-1/2 text-[9px] font-black tracking-wide text-black sm:text-[11px]">
            LV
          </div>
          <div className="absolute left-[7px] top-[17px] h-2 w-[28px] rounded-full bg-orange-200/85 sm:top-[20px] sm:w-[32px]" />
          <div className="absolute bottom-[6px] left-1/2 h-2 w-6 -translate-x-1/2 rounded-full bg-cyan-300/70 sm:w-7" />
        </RobotPiece>

        {/* Braccio sinistro */}
        <RobotPiece
          show={leftArmVisible}
          className={leftArmOuter}
          exitY={80}
          exitRotate={-34}
        >
          <div className="absolute left-[14px] top-[3px] h-3 w-3 rounded-full border-[2px] border-sky-600 bg-sky-400" />
          <div
            className={`absolute left-[9px] top-[8px] h-2 rounded-full bg-sky-300 ${isWon ? "w-[14px] rotate-[8deg]" : "w-[12px] rotate-[22deg]"
              }`}
          />
          <div
            className={`absolute left-[3px] top-[16px] h-2 rounded-full bg-sky-300 ${isWon ? "w-[12px] -rotate-[28deg]" : "w-[10px] rotate-[30deg]"
              }`}
          />
          <div className="absolute left-0 top-[22px] h-4.5 w-4.5 rounded-full border-[2px] border-sky-600 bg-cyan-300" />
        </RobotPiece>

        {/* Braccio destro */}
        <RobotPiece
          show={rightArmVisible}
          className={rightArmOuter}
          exitY={80}
          exitRotate={34}
        >
          <div className="absolute right-[14px] top-[3px] h-3 w-3 rounded-full border-[2px] border-sky-600 bg-sky-400" />
          <div
            className={`absolute right-[9px] top-[8px] h-2 rounded-full bg-sky-300 ${isWon ? "w-[14px] -rotate-[8deg]" : "w-[12px] -rotate-[22deg]"
              }`}
          />
          <div
            className={`absolute right-[3px] top-[16px] h-2 rounded-full bg-sky-300 ${isWon ? "w-[12px] rotate-[28deg]" : "w-[10px] -rotate-[30deg]"
              }`}
          />
          <div className="absolute right-0 top-[22px] h-4.5 w-4.5 rounded-full border-[2px] border-sky-600 bg-cyan-300" />
        </RobotPiece>

        <RobotPiece
          show={leftLegVisible}
          className="absolute left-[24px] top-[80px] h-[24px] w-[10px] sm:left-[29px] sm:top-[96px] sm:h-[28px] sm:w-[12px]"
          exitY={84}
          exitRotate={-16}
        >
          <div className="absolute left-0 top-0 h-[22px] w-[10px] rounded-[8px] border-[3px] border-orange-500 bg-orange-200 sm:h-[24px] sm:w-[12px]" />
        </RobotPiece>

        <RobotPiece
          show={rightLegVisible}
          className="absolute left-[52px] top-[80px] h-[24px] w-[10px] sm:left-[60px] sm:top-[96px] sm:h-[28px] sm:w-[12px]"
          exitY={84}
          exitRotate={16}
        >
          <div className="absolute left-0 top-0 h-[22px] w-[10px] rounded-[8px] border-[3px] border-orange-500 bg-orange-200 sm:h-[24px] sm:w-[12px]" />
        </RobotPiece>
      </div>
    </motion.div>
  );
}


function SolutionRow({ masked, showAnswer }) {
  const total = masked.length;

const boxClass =
  total >= 20
    ? "h-10 w-5 text-[14px]"
    : total >= 15
      ? "h-12 w-7 text-[18px]"
      : "h-16 w-12 text-2xl sm:h-20 sm:w-14 sm:text-3xl";

  const spaceClass =
    total >= 18
      ? "w-1.5"
      : total >= 14
        ? "w-2"
        : "w-3 sm:w-4";

  return (
    <div className="overflow-hidden pb-1">
      <div className="flex flex-wrap justify-center gap-1">
        {masked.map((item) => {
          if (item.type === "space") {
            return <div key={item.key} className={spaceClass} />;
          }

          const displayValue =
            showAnswer && item.type === "letter" ? item.hidden : item.value;

          const isVisible = item.type === "letter" && item.value;

          return (
            <motion.div
              style={
                isVisible
                  ? {
                    textShadow: "0 0 8px rgba(0,0,0,0.2)",
                    transform: "scale(1.05)",
                  }
                  : {}
              }
              key={item.key}
              initial={false}
              animate={
                item.type === "letter" && item.value
                  ? { scale: [1, 1.06, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.2 }}
              className={`flex items-center justify-center rounded-lg border border-gray-300 bg-white text-black font-extrabold uppercase tracking-widest shadow-md ${boxClass}`}
            >
              {displayValue}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Keyboard({ guessed, wrong, onGuess, disabled, rows }) {
  const guessedSet = new Set(guessed);
  const wrongSet = new Set(wrong);
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
      <div className="space-y-1.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {row.map((key) => {
              const isGuessed = guessedSet.has(key);
              const isWrong = wrongSet.has(key);
              const isUsed = isGuessed || isWrong;
              const stateClass = isGuessed
                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                : isWrong
                  ? "border-rose-400/50 bg-rose-500/20 text-rose-200"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled || isUsed}
                  onClick={() => onGuess(key)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold uppercase transition sm:h-9 sm:w-9 sm:text-sm ${stateClass} ${disabled || isUsed ? "cursor-default" : ""}`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/70 p-2.5 shadow-inner">
        <div className="mx-auto h-2.5 w-20 rounded-t-full border border-slate-600/70 bg-slate-700/70" />
        <div className="mt-1 h-1.5 rounded-full bg-slate-800" />
      </div>
    </div>
  );
}

function TopControls({
  onReset,
  onRandom,
  onImport,
  onDownloadTemplate,
  onFullscreen,
  onToggleSound,
  fullscreenMode,
  soundOn,
  compactMode,
  onToggleCompact,
  fileInputRef,
  handleImportFile,
  t,
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] transition hover:bg-white/15 sm:text-xs"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {t.hangman.restart}
      </button>

      <button
        onClick={onRandom}
        className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500/80 px-2.5 py-2 text-[11px] transition hover:bg-pink-500 sm:text-xs"
      >
        <Shuffle className="h-3.5 w-3.5" />
        {t.hangman.random}
      </button>

      <button
        onClick={onImport}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/80 px-2.5 py-2 text-[11px] transition hover:bg-emerald-500 sm:text-xs"
      >
        <Upload className="h-3.5 w-3.5" />
        {t.hangman.import}
      </button>

      <button
        onClick={onDownloadTemplate}
        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/80 px-2.5 py-2 text-[11px] transition hover:bg-violet-500 sm:text-xs"
      >
        <Upload className="h-3.5 w-3.5" />
        {t.hangman.downloadTemplate}
      </button>

      <button
        onClick={onFullscreen}
        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/80 px-2.5 py-2 text-[11px] transition hover:bg-cyan-500 sm:text-xs"
      >
        <Monitor className="h-3.5 w-3.5" />
        {fullscreenMode ? t.hangman.fullscreenExit : t.hangman.fullscreenEnter}
      </button>

      <button
        onClick={onToggleSound}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] transition hover:bg-white/15 sm:text-xs"
      >
        {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        {soundOn ? t.hangman.soundOn : t.hangman.soundOff}
      </button>

      <button
        onClick={onToggleCompact}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] transition hover:bg-white/15 sm:text-xs"
      >
        <PanelsTopLeft className="h-3.5 w-3.5" />
        {compactMode ? t.hangman.showPanels : t.hangman.hidePanels}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleImportFile}
        className="hidden"
      />
    </div>
  );
}

function renderHintWithEmoji(text) {
  const parts = [];
  const parsed = twemoji.parse(String(text ?? ""), {
    folder: "svg",
    ext: ".svg",
  });

  const regex = /<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/g;

  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(parsed)) !== null) {
    const fullMatch = match[0];
    const emojiAlt = match[1];
    const emojiSrc = match[2];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      const textBefore = parsed
        .slice(lastIndex, matchIndex)
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      if (textBefore) {
        parts.push(<span key={`text-${key++}`}>{textBefore}</span>);
      }
    }

    parts.push(
      <img
        key={`emoji-${key++}`}
        src={emojiSrc}
        alt={emojiAlt}
        className="inline-block h-[1em] w-[1em] align-[-0.15em]"
      />
    );

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < parsed.length) {
    const textAfter = parsed
      .slice(lastIndex)
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    if (textAfter) {
      parts.push(<span key={`text-${key++}`}>{textAfter}</span>);
    }
  }

  return parts;
}

export default function HangmanGame({ onBack, selectedLanguage }) {
  const t = UI_TEXT[selectedLanguage];
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessed, setGuessed] = useState(() => new Set());
  const [wrong, setWrong] = useState([]);
  const [status, setStatus] = useState("playing");
  const [inputValue, setInputValue] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customHint, setCustomHint] = useState("");
  const [customDifficulty, setCustomDifficulty] = useState("Media");
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [heartBurstIndex, setHeartBurstIndex] = useState(null);
  const [boardShake, setBoardShake] = useState(false);
  const [flashMode, setFlashMode] = useState("none");
  const [compactMode, setCompactMode] = useState(true);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const previousWrongCountRef = useRef(0);
  const autoNextTimerRef = useRef(null);

  const currentItem = items[currentIndex] || DEFAULT_ITEMS[0];
  const maxHearts = DIFFICULTY_HEARTS[currentItem.difficulty] || 8;

  const uniqueLetters = useMemo(() => getUniqueLetters(currentItem.text), [currentItem.text]);
  const masked = useMemo(() => maskCharacters(currentItem.text, guessed), [currentItem.text, guessed]);
  const guessedCount = uniqueLetters.filter((l) => guessed.has(l)).length;

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case "Facile":
        return t.hangman.easy;
      case "Media":
        return t.hangman.medium;
      case "Difficile":
        return t.hangman.hard;
      default:
        return difficulty;
    }
  };

  const playTone = (frequency, duration = 0.12, type = "sine") => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = 0.035;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error(error);
    }
  };

  const clearRoundState = () => {
    setGuessed(new Set());
    setWrong([]);
    previousWrongCountRef.current = 0;
    setStatus("playing");
    setInputValue("");
    setShowAnswer(false);
    setHeartBurstIndex(null);
    setBoardShake(false);
    setFlashMode("none");
  };

  const resetRound = () => {
    if (autoNextTimerRef.current) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    clearRoundState();
    inputRef.current?.focus();
  };

  const nextRandom = () => {
    if (autoNextTimerRef.current) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (items.length <= 1) {
      resetRound();
      return;
    }
    let next = currentIndex;
    while (next === currentIndex) next = Math.floor(Math.random() * items.length);
    setCurrentIndex(next);
    clearRoundState();
  };

  useEffect(() => {
    const allGuessed = uniqueLetters.length > 0 && uniqueLetters.every((l) => guessed.has(l));
    if (allGuessed) setStatus("won");
    else if (wrong.length >= maxHearts) setStatus("lost");
    else setStatus("playing");
  }, [guessed, uniqueLetters, wrong.length, maxHearts]);

  useEffect(() => {
    const prevWrong = previousWrongCountRef.current;
    if (wrong.length > prevWrong) {
      const lostIndex = maxHearts - wrong.length;
      setHeartBurstIndex(lostIndex);
      setBoardShake(true);
      setFlashMode("wrong");
      playTone(180, 0.22, "sawtooth");
      const shakeTimer = window.setTimeout(() => setBoardShake(false), 420);
      const burstTimer = window.setTimeout(() => setHeartBurstIndex(null), 650);
      const flashTimer = window.setTimeout(() => setFlashMode("none"), 300);
      previousWrongCountRef.current = wrong.length;
      return () => {
        window.clearTimeout(shakeTimer);
        window.clearTimeout(burstTimer);
        window.clearTimeout(flashTimer);
      };
    }
    previousWrongCountRef.current = wrong.length;
    return undefined;
  }, [wrong.length, maxHearts]);

  useEffect(() => {
    if (status === "won") {
      setFlashMode("won");
      playTone(720, 0.08, "triangle");
      const extraTone = window.setTimeout(() => playTone(860, 0.12, "triangle"), 90);
      const resetFlash = window.setTimeout(() => setFlashMode("none"), 700);
      return () => {
        window.clearTimeout(extraTone);
        window.clearTimeout(resetFlash);
      };
    }
    if (status === "lost") playTone(120, 0.35, "square");
    return undefined;
  }, [status]);

  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        window.clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    const onFsChange = () => setFullscreenMode(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleGuess = (raw) => {
    if (!raw || status !== "playing") return;
    const value = normalizeChar(raw[0]);
    if (!LETTER_REGEX.test(value)) return;
    if (guessed.has(value) || wrong.includes(value)) return;
    const exists = uniqueLetters.includes(value);
    if (exists) {
      playTone(740, 0.1, "triangle");
      setGuessed((prev) => new Set([...prev, value]));
    } else {
      setWrong((prev) => [...prev, value]);
    }
  };

  const onSubmitLetter = (event) => {
    event.preventDefault();
    handleGuess(inputValue);
    setInputValue("");
  };

  const downloadTemplateFile = () => {
    const templateRows = [
      ["Text", "Hint", "Difficulty"],
      ["Amore tossico", "Ti distrugge… ma torni sempre 😶", "Difficile"],
      ["Friendzone", "Ti vuole… ma non così 😭", "Facile"],
      ["Pensieri notturni", "Di giorno ok… di notte no 😶‍🌫️", "Media"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Import_WebApp");
    XLSX.writeFile(workbook, "hangman_template.xlsx");
  };

  const addCustomItem = () => {
    const cleanText = customText.trim();
    const cleanHint = customHint.trim();
    if (!cleanText || !cleanHint) return;
    const newItem = { text: cleanText, hint: cleanHint, difficulty: customDifficulty };
    setItems((prev) => [...prev, newItem]);
    setCurrentIndex(items.length);
    setCustomText("");
    setCustomHint("");
    setCustomDifficulty("Media");
    clearRoundState();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const fileName = file.name.toLowerCase();
      let parsed = [];

      if (fileName.endsWith(".csv")) {
        const text = await file.text();

        const workbook = XLSX.read(text, {
          type: "string",
          FS: text.includes(";") ? ";" : ",",
        });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false,
          defval: "",
        });
        parsed = parseImportedRows(rows);

      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames.includes("Import_WebApp")
          ? "Import_WebApp"
          : workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false,
          defval: "",
        });

        parsed = parseImportedRows(rows);

      }

      if (parsed.length > 0) {
        setItems(parsed);
        setCurrentIndex(0);
        clearRoundState();
        console.log(`Import riuscito: ${parsed.length} righe caricate.`);
      } else {
        console.warn("Import non riuscito: servono almeno le colonne Text e Hint oppure Parola/Frase e Indizio.");
      }
    } catch (error) {
      console.error(error);
      console.error("Import non riuscito: file non leggibile o formato non supportato.");
    }

    event.target.value = "";
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      setFullscreenMode(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreenMode(false);
    }
  };

  const activeHearts = maxHearts - wrong.length;
  const hearts = Array.from({ length: maxHearts }, (_, i) => i < activeHearts);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-4 text-slate-100 md:p-8">

      <style>{`
      img.twemoji-small {
        height: 0.9em;
        width: 0.9em;
        vertical-align: -0.12em;
        display: inline-block;
      }
    `}</style>

      <AnimatePresence>
        {flashMode === "wrong" ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.16 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-0 bg-red-500" /> : null}
      </AnimatePresence>
      <AnimatePresence>
        {flashMode === "won" ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.14 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-0 bg-emerald-400" /> : null}
      </AnimatePresence>

      <div className={`relative z-10 mx-auto ${compactMode ? "max-w-3xl" : "max-w-6xl"}`}>
        {compactMode ? (
          <motion.div animate={boardShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }} transition={{ duration: 0.35 }} className="flex h-full flex-col rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm sm:p-4">
            <div className="flex justify-center mb-2">
              <button
                onClick={onBack}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                {t.home.backToMenu}
              </button>
            </div>
            <TopControls
              onReset={resetRound}
              onRandom={nextRandom}
              onImport={() => fileInputRef.current?.click()}
              onDownloadTemplate={downloadTemplateFile}
              onFullscreen={toggleFullscreen}
              onToggleSound={() => setSoundOn((prev) => !prev)}
              fullscreenMode={fullscreenMode}
              soundOn={soundOn}
              compactMode={compactMode}
              onToggleCompact={() => setCompactMode((prev) => !prev)}
              fileInputRef={fileInputRef}
              handleImportFile={handleImportFile}
              t={t}
            />

            <div className="mt-3 rounded-3xl border border-white/10 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-cyan-500/20 p-4 text-center">
              <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-pink-200/80">{t.hangman.clue}</div>
              <div className="text-sm font-semibold leading-relaxed sm:text-base">
                {renderHintWithEmoji(currentItem.hint)}
              </div>
              <div className="mt-2 text-[11px] text-slate-300">
                {getDifficultyLabel(currentItem.difficulty)} • {maxHearts} {t.hangman.hearts}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5">
              {hearts.map((alive, idx) => {
                const isBurst = heartBurstIndex === idx;

                return (
                  <motion.div
                    key={idx}
                    initial={false}
                    animate={
                      alive
                        ? { scale: 1, opacity: 1 }
                        : { scale: 1, opacity: 0.35 }
                    }
                    transition={{ duration: 0.2 }}
                    className={`relative rounded-2xl border px-2 py-1 ${alive
                      ? "border-rose-400/50 bg-rose-500/20"
                      : "border-slate-700 bg-slate-800"
                      }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${alive
                        ? "fill-rose-400 text-rose-300"
                        : "text-slate-500"
                        }`}
                    />

                    <AnimatePresence>
                      {isBurst ? (
                        <motion.div
                          initial={{ scale: 0.4, opacity: 0.9 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.45 }}
                          className="absolute inset-0 rounded-2xl border-2 border-rose-300"
                        />
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-2 text-center text-[11px] text-slate-400">
              {status === "playing"
                ? `${t.hangman.errors} ${wrong.length}/${maxHearts}`
                : status === "won"
                  ? t.hangman.won
                  : t.hangman.lost}
            </div>

            <div className="mt-2 flex justify-center">
              <RobotArena wrongCount={wrong.length} maxHearts={maxHearts} isLost={status === "lost"} isWon={status === "won"} />
            </div>

            <div className="mt-2 rounded-3xl border border-white/10 bg-slate-900/60 p-2.5">
              <SolutionRow masked={masked} showAnswer={showAnswer} />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value.slice(0, 1))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue) {
                    e.preventDefault();
                    handleGuess(inputValue);
                    setInputValue("");
                  }
                }}
                placeholder={t.hangman.letterPlaceholder}
                className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-pink-400"
              />

              <button
                type="button"
                onClick={() => setShowAnswer((prev) => !prev)}
                className="rounded-2xl bg-white/10 px-3 py-2.5 text-sm transition hover:bg-white/15"
              >
                {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={nextRandom}
                disabled={status === "playing"}
                className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${status === "playing"
                  ? "cursor-not-allowed bg-white/5 text-slate-500"
                  : "bg-emerald-500/80 text-white hover:bg-emerald-500"
                  }`}
              >
                {t.hangman.next}
              </button>
            </div>
            <div className="mt-2 flex-1">
              <Keyboard
                guessed={guessed}
                wrong={wrong}
                onGuess={handleGuess}
                disabled={status !== "playing"}
                rows={KEYBOARD_LAYOUTS[selectedLanguage]}
              />
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <motion.div animate={boardShake ? { x: [0, -8, 8, -6, 6, -2, 2, 0] } : { x: 0 }} transition={{ duration: 0.4 }} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm md:p-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-pink-300/80">
                    {t.hangman.liveGame}
                  </p>
                  <h1 className="text-2xl font-bold md:text-4xl">
                    {t.hangman.title}
                  </h1>
                </div>
                {/* BOTTONE BACK */}
                <div className="flex justify-center mb-2">
                  <button
                    onClick={onBack}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    {t.home.backToMenu}
                  </button>
                </div>
                <TopControls
                  onReset={resetRound}
                  onRandom={nextRandom}
                  onImport={() => fileInputRef.current?.click()}
                  onDownloadTemplate={downloadTemplateFile}
                  onFullscreen={toggleFullscreen}
                  onToggleSound={() => setSoundOn((prev) => !prev)}
                  fullscreenMode={fullscreenMode}
                  soundOn={soundOn}
                  compactMode={compactMode}
                  onToggleCompact={() => setCompactMode((prev) => !prev)}
                  fileInputRef={fileInputRef}
                  handleImportFile={handleImportFile}
                  t={t}
                />
              </div>

              <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-cyan-500/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-sm text-slate-300">{t.hangman.clue}</p>
                    <p
                      className="text-xl font-semibold leading-relaxed md:text-2xl"
                      style={{
                        fontFamily:
                          '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Segoe UI", sans-serif',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: twemoji.parse(currentItem.hint, {
                          folder: "svg",
                          ext: ".svg",
                          className: "twemoji-small",
                        }),
                      }}
                    />
                  </div>
                  <div className="whitespace-nowrap rounded-2xl bg-black/20 px-3 py-2 text-sm">
                    {getDifficultyLabel(currentItem.difficulty)} • {maxHearts} {t.hangman.hearts}
                  </div>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {hearts.map((alive, idx) => {
                  const isBurst = heartBurstIndex === idx;
                  return (
                    <motion.div key={idx} initial={false} animate={alive ? { scale: [1, 1.08, 1] } : { scale: 1, opacity: 0.45 }} transition={{ duration: 0.35 }} className={`relative rounded-2xl border px-3 py-2 ${alive ? "border-rose-400/40 bg-rose-500/15" : "border-slate-700 bg-slate-800 opacity-40"}`}>
                      <Heart className={`h-5 w-5 ${alive ? "fill-rose-400 text-rose-300" : "text-slate-500"}`} />
                      <AnimatePresence>
                        {isBurst ? <motion.div initial={{ scale: 0.4, opacity: 0.9 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 rounded-2xl border-2 border-rose-300" /> : null}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mb-4 flex justify-center">
                <RobotArena wrongCount={wrong.length} maxHearts={maxHearts} isLost={status === "lost"} isWon={status === "won"} />
              </div>

              <div className="mb-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                <SolutionRow masked={masked} showAnswer={showAnswer} />
              </div>

              <div className="mb-4 grid items-end gap-4 md:grid-cols-[1fr_auto_auto]">
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value.slice(0, 1))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputValue) {
                        e.preventDefault();
                        handleGuess(inputValue);
                        setInputValue("");
                      }
                    }}
                    placeholder={t.hangman.longLetterPlaceholder}
                    className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-pink-400"
                  />
                </div>
                <button
                  onClick={() => setShowAnswer((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/15"
                >
                  {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showAnswer ? t.hangman.hideSolution : t.hangman.showSolution}
                </button>

                <button
                  type="button"
                  onClick={nextRandom}
                  disabled={status === "playing"}
                  className={`rounded-2xl px-4 py-3 font-semibold transition ${status === "playing"
                    ? "cursor-not-allowed bg-white/5 text-slate-500"
                    : "bg-emerald-500/80 text-white hover:bg-emerald-500"
                    }`}
                >
                  {t.hangman.next}
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <Keyboard
                  guessed={[...guessed]}
                  wrong={wrong}
                  onGuess={handleGuess}
                  disabled={status !== "playing"}
                  rows={KEYBOARD_LAYOUTS[selectedLanguage]}
                />
              </div>
            </motion.div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
                <h2 className="mb-4 text-xl font-bold">{t.hangman.addItemTitle}</h2>
                <div className="space-y-3">
                  <input value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder={t.hangman.itemPlaceholder} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-pink-400" />
                  <textarea value={customHint} onChange={(event) => setCustomHint(event.target.value)} placeholder={t.hangman.cluePlaceholder} rows={4} className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-pink-400" />
                  <select
                    value={customDifficulty}
                    onChange={(event) => setCustomDifficulty(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-pink-400"
                  >
                    <option value="Facile">{t.hangman.easy}</option>
                    <option value="Media">{t.hangman.medium}</option>
                    <option value="Difficile">{t.hangman.hard}</option>
                  </select>
                  <button onClick={addCustomItem} className="w-full rounded-2xl bg-emerald-500/80 px-4 py-3 font-semibold hover:bg-emerald-500">{t.hangman.addAndPlay}</button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
                <h2 className="mb-4 text-xl font-bold">{t.hangman.archiveTitle}</h2>
                <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                  {items.map((item, idx) => (
                    <button key={`${idx}-${item.difficulty}`} onClick={() => { setCurrentIndex(idx); clearRoundState(); }} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${idx === currentIndex ? "border-pink-400/40 bg-pink-500/15" : "border-white/10 bg-black/20 hover:bg-white/10"}`}>
                      <div className="font-semibold">
                        {t.hangman.roundLabel} {idx + 1}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {getDifficultyLabel(item.difficulty)} • {t.hangman.hiddenSolution}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

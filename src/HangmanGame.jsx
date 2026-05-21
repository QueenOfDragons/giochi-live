import React, { useEffect, useMemo, useRef, useState } from "react";
import twemoji from "twemoji";
import { UI_TEXT } from "./texts/uiText";

// ── TEMA COLORI — modifica qui per cambiare tutta la palette ─────────────────
const THEME = {
  bg:         "#3a1a0a",   // sfondo principale — terracotta scuro
  bgCard:     "#2a0f05",   // sfondo card/box
  bgCardAlt:  "#1a0800",   // sfondo secondario
  border:     "#6a3520",   // bordi
  borderGlow: "#a05030",   // bordi luminosi
  accent:     "#fb923c",   // corallo principale
  accentAlt:  "#fbbf24",   // oro
  accentSoft: "#fed7aa",   // corallo chiaro
  text:       "#fff1ee",   // testo principale
  textMuted:  "#d4956a",   // testo secondario
  textFaint:  "#8a4a2a",   // testo sfumato
  correct:    "#22c55e",   // verde corretto
  wrong:      "#ef4444",   // rosso sbagliato
  heart:      "#f43f5e",   // cuori
};
// ─────────────────────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  ArrowRight,
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

const DEFAULT_ITEMS_IT = [
  { text: "Chat silenziosa", hint: "Tutti leggono… nessuno scrive 👀", difficulty: "Media" },
  { text: "Friendzone", hint: "Ti vuole… ma non così 😭", difficulty: "Facile" },
  { text: "Visualizza e non risponde", hint: "Ti legge… e sceglie di no 😏", difficulty: "Difficile" },
  { text: "Pensieri notturni", hint: "Di giorno ok… di notte no 😶‍🌫️", difficulty: "Media" },
];

const DEFAULT_ITEMS_EN = [
  { text: "Break a leg", hint: "What you say to an actor before they go on stage 🎭", difficulty: "Facile" },
  { text: "Hit the sack", hint: "Time to go to sleep 😴", difficulty: "Facile" },
  { text: "Bite the bullet", hint: "Endure a painful situation with courage 💪", difficulty: "Media" },
  { text: "Spill the beans", hint: "Accidentally reveal a secret 🫘", difficulty: "Facile" },
  { text: "Under the weather", hint: "Feeling a bit sick 🤒", difficulty: "Media" },
  { text: "The early bird catches the worm", hint: "Success comes to those who start early 🐦", difficulty: "Difficile" },
  { text: "Barking up the wrong tree", hint: "Looking for something in the wrong place 🌳", difficulty: "Difficile" },
  { text: "Kill two birds with one stone", hint: "Solve two problems with one action 🎯", difficulty: "Media" },
  { text: "Beat around the bush", hint: "Avoid talking about the main topic 🌿", difficulty: "Media" },
  { text: "Once in a blue moon", hint: "Something that happens very rarely 🌙", difficulty: "Facile" },
];

const DEFAULT_ITEMS_FR = [
  { text: "Avoir le cafard", hint: "Se sentir déprimé ou triste 🪳", difficulty: "Facile" },
  { text: "Casser les pieds", hint: "Ennuyer ou agacer quelqu'un 🦶", difficulty: "Media" },
  { text: "Il pleut des cordes", hint: "Il pleut très fort dehors 🌧️", difficulty: "Facile" },
  { text: "Poser un lapin", hint: "Ne pas venir à un rendez-vous 🐰", difficulty: "Media" },
];

const DEFAULT_ITEMS_RO = [
  { text: "A da cu oiștea-n gard", hint: "A face o greșeală mare 🐑", difficulty: "Media" },
  { text: "A tăia frunze la câini", hint: "A pierde timpul fără a face nimic 🐕", difficulty: "Difficile" },
  { text: "A se face că plouă", hint: "A ignora intenționat ceva 🌧️", difficulty: "Media" },
];

const DEFAULT_ITEMS_BY_LANG = {
  it: DEFAULT_ITEMS_IT,
  en: DEFAULT_ITEMS_EN,
  fr: DEFAULT_ITEMS_FR,
  ro: DEFAULT_ITEMS_RO,
};

const DEFAULT_ITEMS = DEFAULT_ITEMS_IT;

const DIFFICULTY_HEARTS = {
  Facile: 6,
  Media: 8,
  Difficile: 10,
};

const LETTER_REGEX = /[A-Za-zÀ-ÖØ-öø-ÿĀ-ɏ0-9]/;

const KEYBOARD_LAYOUTS = {
  it: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"],
    ["q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "à", "è", "é", "ì", "ò", "ù"],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ],
  en: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"],
    ["n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ],
  ro: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"],
    ["q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "ă", "â", "î"],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ],
  fr: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s"],
    ["t", "u", "v", "w", "x", "y", "z", "à", "â", "ç", "é", "è", "ê", "ë", "î", "ï", "ô", "ù", "û"],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ],
};

function decodeExcelText(value) {
  return String(value ?? "")
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

function normalizeDifficultyLabel(value) {
  const d = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-̦ͯ]/g, ""); // rimuove accenti e diacritici

  if (["facile", "easy", "usor"].includes(d)) return "Facile";
  if (["media", "medium", "mediu", "moyen"].includes(d)) return "Media";
  if (["difficile", "hard", "dificil"].includes(d)) return "Difficile";

  return "Media";
}

function normalizeHeaderValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseImportedRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];

  const header = rows[0].map((v) => normalizeHeaderValue(v));

  const findColumnIndex = (headerRow, keywords) => {
    return headerRow.findIndex((h) => keywords.some((k) => h.includes(k)));
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
    "mot",
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
    "indice",
  ]);

  const categoryIdx = findColumnIndex(header, [
    "category",
    "categoria",
    "categorie",
    "cat",
  ]);

  const difficultyIdx = findColumnIndex(header, [
    "difficulty",
    "difficolta",
    "livello",
    "level",
    "dificultate",
    "niveau",
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
      category: categoryIdx >= 0 ? decodeExcelText(row?.[categoryIdx] ?? "") : "",
      difficulty:
        decodeExcelText(difficultyIdx >= 0 ? row?.[difficultyIdx] ?? "Media" : "Media") || "Media",
    }))
    .filter((item) => item.text && item.hint)
    .map((item) => ({
      ...item,
      difficulty: normalizeDifficultyLabel(item.difficulty),
    }));
}

function normalizeChar(char) {
  return String(char ?? "")
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u0326]/g, "");
}

const VOWELS = new Set(["a","e","i","o","u","à","è","é","ì","ò","ù","â","ê","î","ô","û","ă","â","î"]);

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

  const masked = maskCharacters("Ciao!", new Set(["c", "a"]));
  console.assert(masked[0].value === "C", "Mask: C non visibile");
  console.assert(masked[4].value === "!", "Mask: punteggiatura non mantenuta");
}

if (typeof window !== "undefined") runSelfChecks();

function RobotPiece({
  show,
  className = "",
  children,
  exitY = 120,
  exitRotate = 28,
  exitScale = 0.7,
  duration = 0.35,
}) {
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
      <div className="absolute top-[14px] flex gap-5">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            animate={isHappy ? { scaleY: [1, 0.4, 1] } : { scaleY: [1, 0.1, 1] }}
            transition={{ duration: isHappy ? 0.6 : 2.5, repeat: Infinity, repeatDelay: isHappy ? 0.8 : 2 }}
            className="relative h-2.5 w-2.5 rounded-full bg-sky-800"
          >
            {!isSad && <div className="absolute left-[1px] top-[1px] h-1 w-1 rounded-full bg-white" />}
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-[9px] flex w-full justify-center">
        <div
          className={`border-b-[3px] border-sky-700 ${isSad
            ? "h-2 w-5 rounded-b-full border-t-0 border-b-2"
            : isHappy
              ? "h-3 w-6 rounded-b-full border-t-0 border-b-2"
              : "h-2 w-5 rounded-b-full border-t-0 border-b-2"
            }`}
        />
      </div>

      {isHappy && (
        <>
          <div className="absolute bottom-[10px] left-[6px] h-2 w-2 rounded-full bg-pink-300 opacity-80" />
          <div className="absolute bottom-[10px] right-[6px] h-2 w-2 rounded-full bg-pink-300 opacity-80" />
        </>
      )}
    </div>
  );
}

function RobotArena({ wrongCount, maxHearts, isLost, isWon }) {
  const remaining = maxHearts - wrongCount;
  const sadLevel = Math.min(5, Math.round((wrongCount / maxHearts) * 5));

  const BALLOON_COLORS = [
    { fill: "#ef4444", stroke: "#b91c1c" },
    { fill: "#f97316", stroke: "#c2410c" },
    { fill: "#eab308", stroke: "#a16207" },
    { fill: "#22c55e", stroke: "#15803d" },
    { fill: "#3b82f6", stroke: "#1d4ed8" },
    { fill: "#a855f7", stroke: "#7e22ce" },
    { fill: "#ec4899", stroke: "#be185d" },
    { fill: "#14b8a6", stroke: "#0f766e" },
    { fill: "#f43f5e", stroke: "#be123c" },
    { fill: "#84cc16", stroke: "#4d7c0f" },
  ];
  const balloons = BALLOON_COLORS.slice(0, maxHearts);



  return (
    <motion.div
      animate={isWon ? { scale:[1,1.03,1], rotate:[0,1,-1,0], y:[0,-2,0] } : isLost ? {} : { y:[0,-2,0] }}
      transition={isWon ? { duration:1.2, repeat: Infinity } : { duration:2.2, repeat: Infinity }}
      className="relative flex h-[118px] items-center justify-center sm:h-[140px]"
    >
      <div className="relative" style={{ width: 110, height: 112 }}>

        {/* PALLONCINI partono dall'aletta sinistra */}
        <div className="absolute" style={{ left: 14, top: 38, width: 0, height: 0 }}>
          <svg style={{ position:"absolute", overflow:"visible", pointerEvents:"none" }} width="1" height="1">
            {balloons.map((_, i) => {
              if (i >= remaining) return null;
              const angle = balloons.length <= 1 ? 0 : -45 + (90 / Math.max(balloons.length-1,1)) * i;
              const rad = (angle * Math.PI) / 180;
              const dist = 28 + (i%2)*8;
              const bx = Math.round(Math.sin(rad)*dist);
              const by = Math.round(Math.cos(rad)*dist);
              return <line key={i} x1="0" y1="0" x2={-bx} y2={-by} stroke="#94a3b8" strokeWidth="1" />;
            })}
          </svg>
          {balloons.map((color, i) => {
            const angle = balloons.length <= 1 ? 0 : -45 + (90 / Math.max(balloons.length-1,1)) * i;
            const rad = (angle * Math.PI) / 180;
            const dist = 28 + (i%2)*8;
            const bx = Math.round(Math.sin(rad)*dist);
            const by = Math.round(Math.cos(rad)*dist);
            return (
              <AnimatePresence key={i}>
                {i < remaining && (
                  <motion.div
                    initial={{ opacity:0, scale:0.3 }}
                    animate={{ opacity:1, scale:1, x:[0, bx>0?1.2:-1.2, 0] }}
                    exit={{ opacity:0, y:-90, x:-bx*3, scale:0.2 }}
                    transition={{ duration:0.6, x:{ duration:2.5+(i*0.2), repeat:Infinity } }}
                    style={{ position:"absolute", left:`${-bx-13}px`, top:`${-by-28}px` }}
                  >
                    <svg width="26" height="30" viewBox="0 0 26 30">
                      <ellipse cx="13" cy="13" rx="11" ry="12" fill={color.fill} stroke={color.stroke} strokeWidth="1.5" />
                      <ellipse cx="9" cy="7" rx="3.5" ry="4" fill="white" opacity="0.35" />
                      <polygon points="11,25 15,25 13,30" fill={color.fill} />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* PINGUINO */}
        <svg width="110" height="112" viewBox="0 0 110 112" style={{ position:"absolute", left:0, top:0 }}>
          {/* ombra */}
          <ellipse cx="55" cy="108" rx="24" ry="4" fill="#000" opacity="0.2" />
          {/* corpo */}
          <ellipse cx="55" cy="72" rx="26" ry="30" fill="#1e293b" />
          {/* pancia */}
          <ellipse cx="55" cy="76" rx="17" ry="22" fill="white" />
          {/* LV */}
          <text x="55" y="78" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f766e" fontFamily="Arial">LV</text>
          {/* testa */}
          <ellipse cx="55" cy="36" rx="21" ry="21" fill="#1e293b" />
          {/* faccia */}
          <ellipse cx="55" cy="38" rx="16" ry="17" fill="white" />
          {/* occhi kawaii — cerchio esterno scuro + interno bianco + pupilla */}
          <circle cx="49" cy="33" r="4" fill="#1e293b" />
          <circle cx="61" cy="33" r="4" fill="#1e293b" />
          <circle cx="49" cy="33" r="2.5" fill="white" />
          <circle cx="61" cy="33" r="2.5" fill="white" />
          <circle cx="49" cy="33" r="1.2" fill="#1e293b" />
          <circle cx="61" cy="33" r="1.2" fill="#1e293b" />
          <circle cx="50" cy="32" r="0.5" fill="white" />
          <circle cx="62" cy="32" r="0.5" fill="white" />
          {/* lacrime lunghe stile emoji */}
          {sadLevel >= 4 && (
            <path d="M62,37 Q63,42 62,50 Q61,55 62,58" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
          )}
          {sadLevel >= 5 && (
            <path d="M48,37 Q47,42 48,50 Q49,55 48,58" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
          )}
          {/* sopracciglia — arcuate felici, poi tristi */}
          <path
            d={`M46,${29 - Math.max(0, 3 - sadLevel)*1.2} Q49,${26 - Math.max(0, 3 - sadLevel)*1.5 + sadLevel*0.5} 52,${29 - Math.max(0, 2 - sadLevel)*0.8 - sadLevel*0.5}`}
            stroke="#5a2d0c" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path
            d={`M58,${29 - Math.max(0, 2 - sadLevel)*0.8 - sadLevel*0.5} Q61,${26 - Math.max(0, 3 - sadLevel)*1.5 + sadLevel*0.5} 64,${29 - Math.max(0, 3 - sadLevel)*1.2}`}
            stroke="#5a2d0c" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* becco — sorridente all'inizio, neutro alla fine */}
          <path
            d={[
              "M50,41 Q55,46 60,41 Q55,38 50,41",  // 0 sorriso aperto
              "M50,41 Q55,45 60,41 Q55,38 50,41",  // 1
              "M50,41 Q55,44 60,41 Q55,38 50,41",  // 2
              "M50,41 Q55,43 60,41 Q55,38 50,41",  // 3 neutro
              "M50,41 Q55,42 60,41 Q55,38 50,41",  // 4
              "M50,41 Q55,41 60,41 Q55,38 50,41",  // 5 piatto
            ][Math.min(sadLevel, 5)]}
            fill="#f97316" stroke="#ea580c" strokeWidth="0.8" />

          {/* guance */}
          <ellipse cx="43" cy="39" rx="4" ry="3" fill="#fda4af" opacity={Math.max(0.1, 0.55-sadLevel*0.1)} />
          <ellipse cx="67" cy="39" rx="4" ry="3" fill="#fda4af" opacity={Math.max(0.1, 0.55-sadLevel*0.1)} />
          {/* aletta SX alzata */}
          <path d="M29,60 Q18,52 16,42 Q15,33 21,31 Q27,30 28,40 Q29,48 31,56Z" fill="#1e293b" />
          <circle cx="17" cy="31" r="5" fill="#1e293b" />
          {/* aletta DX */}
          <path d="M81,60 Q90,54 92,64 Q93,73 88,76 Q82,78 81,69 Q79,62 81,60Z" fill="#1e293b" />
          {/* piedi */}
          <ellipse cx="43" cy="101" rx="12" ry="5" fill="#f97316" />
          <ellipse cx="67" cy="101" rx="12" ry="5" fill="#f97316" />
        </svg>

      </div>
    </motion.div>
  );
}


function SolutionRow({ masked, showAnswer }) {
  const displayItems = masked.map((item) => {
    if (item.type === "space") return item;

    const displayValue =
      showAnswer && item.type === "letter" ? item.hidden : item.value;

    return {
      ...item,
      displayValue,
      isVisible: item.type === "letter" && item.value,
    };
  });

  // Raggruppa per parole, così il wrap avviene tra parole e non in mezzo
  const words = [];
  let currentWord = [];

  displayItems.forEach((item) => {
    if (item.type === "space") {
      if (currentWord.length > 0) {
        words.push(currentWord);
        currentWord = [];
      }
    } else {
      currentWord.push(item);
    }
  });

  if (currentWord.length > 0) {
    words.push(currentWord);
  }

  const total = displayItems.length;

  let boxClass =
    "flex h-[56px] w-[30px] items-center justify-center rounded-md border border-gray-300 bg-white text-black text-[28px] font-extrabold uppercase leading-none shadow-md";

  let wordGapClass = "gap-5";
  let letterGapClass = "gap-1";

  if (total >= 26) {
    boxClass =
      "flex h-[46px] w-[24px] items-center justify-center rounded-md border border-gray-300 bg-white text-black text-[22px] font-extrabold uppercase leading-none shadow-md";
    wordGapClass = "gap-4";
    letterGapClass = "gap-[3px]";
  } else if (total >= 20) {
    boxClass =
      "flex h-[50px] w-[26px] items-center justify-center rounded-md border border-gray-300 bg-white text-black text-[24px] font-extrabold uppercase leading-none shadow-md";
    wordGapClass = "gap-3";
    letterGapClass = "gap-[4px]";
  }

  return (
    <div className="overflow-hidden py-1">
      <div className="flex min-h-[92px] items-center justify-center">
        <div className={`flex max-w-full flex-wrap justify-center ${wordGapClass} gap-y-3`}>
          {words.map((word, wordIndex) => {
            const isWordComplete = word.every(
              (item) => item.type !== "letter" || item.value
            );

            return (
              <motion.div
                key={wordIndex}
                initial={false}
                animate={
                  isWordComplete
                    ? {
                      boxShadow: [
                        "0 0 8px rgba(34,197,94,0.35)",
                        "0 0 16px rgba(34,197,94,0.65)",
                        "0 0 8px rgba(34,197,94,0.35)",
                      ],
                      scale: [1, 1.02, 1],
                    }
                    : {
                      boxShadow: "0 0 6px rgba(34,211,238,0.3)",
                      scale: 1,
                    }
                }
                transition={{
                  duration: isWordComplete ? 1.2 : 0.2,
                  repeat: isWordComplete ? Infinity : 0,
                }}
                className={`
                  flex ${letterGapClass} px-2 py-1 rounded-xl border
                  ${isWordComplete
                    ? "border-emerald-400 bg-emerald-500/10"
                    : "border-cyan-300/40 bg-white/10"
                  }
                `}
              >
                {word.map((item) => (
                  <motion.div
                    key={item.key}
                    initial={false}
                    animate={
                      item.type === "letter" && item.value
                        ? {
                          rotateX: [90, 0],
                          scale: [1, 1.06, 1],
                        }
                        : {
                          rotateX: 0,
                          scale: 1,
                        }
                    }
                    transition={{
                      duration: 0.35,
                      ease: "easeOut",
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      ...(item.isVisible
                        ? { textShadow: "0 0 6px rgba(0,0,0,0.18)" }
                        : {}),
                    }}
                    className={boxClass}
                  >
                    {item.displayValue}
                  </motion.div>
                ))}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Keyboard({ guessed, wrong, onGuess, disabled, rows, slotHighlight = null, competitionMode = false }) {
  const guessedSet = new Set(guessed);
  const wrongSet = new Set(wrong);

  return (
    <div className="rounded-3xl border border-[#6a3520]/40 bg-black/20 p-2.5">
      <div className="space-y-1">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => {
              const isGuessed = guessedSet.has(key);
              const isWrong = wrongSet.has(key);
              const isUsed = isGuessed || isWrong;
              const isSlot = slotHighlight === key;
              const stateClass = isSlot
                ? "border-yellow-300 bg-yellow-400 text-black font-black scale-110"
                : isGuessed
                  ? "border-emerald-400 bg-emerald-500 text-white font-bold"
                  : isWrong
                    ? "border-rose-400 bg-rose-500 text-white font-bold"
                    : "border-white/20 bg-white/10 text-[#fff1ee] hover:bg-white/20";

              return (
                <button key={key} type="button" disabled={disabled || isUsed || competitionMode} onClick={() => !competitionMode && onGuess(key)} className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-semibold uppercase transition sm:h-8 sm:w-8 sm:text-xs ${stateClass} ${disabled || isUsed || competitionMode ? "cursor-default" : ""}`}>
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-2xl border border-[#6a3520]/40 bg-[#2a0f05]/70 p-2 shadow-inner">
        <div className="mx-auto h-2 w-16 rounded-t-full border border-slate-600/70 bg-slate-700/70" />
        <div className="mt-1 h-1 rounded-full bg-[#1a0800]" />
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
  onNext,
  onPrev,
  hasAttempted,
  onBack,
  onLanguageChange,
  currentLanguage,
  t,
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="relative flex items-center justify-between gap-2">
      {/* Sinistra: bottone menu ⚙️ */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] transition hover:bg-white/15"
        >
          ⚙️
        </button>

        {/* Menu a tendina */}
        {menuOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-2xl border border-[#6a3520]/40 bg-[#2a0f05] shadow-2xl p-2 flex flex-col gap-1">
            <button onClick={() => { onBack(); setMenuOpen(false); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#f0c8a0] hover:bg-white/10 transition text-left">← {t.home.backToMenu}</button>
            <div className="h-px bg-white/10 my-1" />
            {/* Selezione lingua */}
            <div className="flex items-center gap-1 px-3 py-1">
              {[
                { code: "it", img: "https://hatscripts.github.io/circle-flags/flags/it.svg" },
                { code: "en", img: "https://hatscripts.github.io/circle-flags/flags/gb.svg" },
                { code: "fr", img: "https://hatscripts.github.io/circle-flags/flags/fr.svg" },
                { code: "ro", img: "https://hatscripts.github.io/circle-flags/flags/ro.svg" },
              ].map(({ code, img }) => (
                <button key={code} onClick={() => { onLanguageChange(code); setMenuOpen(false); }}
                  className={`rounded-lg p-1 transition ${currentLanguage === code ? "bg-white/20 ring-2 ring-white/40" : "hover:bg-white/10"}`}>
                  <img src={img} alt={code} className="h-5 w-8 rounded-sm object-cover" />
                </button>
              ))}
            </div>
            <div className="h-px bg-white/10 my-1" />
            <button onClick={() => { onReset(); setMenuOpen(false); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#f0c8a0] hover:bg-white/10 transition"><RotateCcw className="h-3.5 w-3.5" />{t.hangman.restart}</button>
            <button onClick={() => { onImport(); setMenuOpen(false); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#f0c8a0] hover:bg-emerald-500/20 transition"><Upload className="h-3.5 w-3.5" />{t.hangman.import}</button>
            <button onClick={() => { onRandom(); setMenuOpen(false); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#f0c8a0] hover:bg-pink-500/20 transition"><Shuffle className="h-3.5 w-3.5" />{t.hangman.random}</button>
            <button onClick={() => { onDownloadTemplate(); setMenuOpen(false); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#f0c8a0] hover:bg-white/10 transition"><Upload className="h-3.5 w-3.5" />{t.hangman.downloadTemplate}</button>
            <button onClick={() => { onFullscreen(); setMenuOpen(false); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#f0c8a0] hover:bg-cyan-500/20 transition"><Monitor className="h-3.5 w-3.5" />{fullscreenMode ? t.hangman.fullscreenExit : t.hangman.fullscreenEnter}</button>
            <button onClick={() => { onToggleSound(); setMenuOpen(false); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#f0c8a0] hover:bg-white/10 transition">{soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}{soundOn ? t.hangman.soundOn : t.hangman.soundOff}</button>
            <button onClick={() => { onToggleCompact(); setMenuOpen(false); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#f0c8a0] hover:bg-white/10 transition"><PanelsTopLeft className="h-3.5 w-3.5" />{compactMode ? t.hangman.showPanels : t.hangman.hidePanels}</button>
          </div>
        )}
      </div>

      {/* Destra: Avanti o Abbandona */}
      <div className="flex justify-end">
        <button onClick={onPrev} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-white transition bg-[#2a6a40]/60 hover:bg-[#2a6a40]">
          <ArrowLeft className="h-3.5 w-3.5" />{t.hangman?.prev || "Indietro"}
        </button>
        <button onClick={onNext} className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-white transition ${hasAttempted ? "bg-rose-500/80 hover:bg-rose-500" : "bg-cyan-500/80 hover:bg-cyan-500"}`}>
          <ArrowRight className="h-3.5 w-3.5" />{hasAttempted ? (t.hangman?.abandon || "Abbandona") : (t.hangman?.next || "Avanti")}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
    </div>
  );
}

function renderHintWithEmoji(text) {
  const parts = [];
  const parsed = twemoji.parse(String(text ?? ""), { folder: "svg", ext: ".svg" });
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
      const textBefore = parsed.slice(lastIndex, matchIndex).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      if (textBefore) parts.push(<span key={`text-${key++}`}>{textBefore}</span>);
    }

    parts.push(<img key={`emoji-${key++}`} src={emojiSrc} alt={emojiAlt} className="inline-block h-[1em] w-[1em] align-[-0.15em]" />);
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < parsed.length) {
    const textAfter = parsed.slice(lastIndex).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    if (textAfter) parts.push(<span key={`text-${key++}`}>{textAfter}</span>);
  }

  return parts;
}

const STORAGE_KEY_PREFIX = "hangman_items_";

function loadItemsFromStorage(language) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + language);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* ignora errori localStorage */ }
  return DEFAULT_ITEMS_BY_LANG[language] || DEFAULT_ITEMS_IT;
}

function saveItemsToStorage(language, items) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + language, JSON.stringify(items));
  } catch (e) { /* ignora errori localStorage */ }
}

export default function HangmanGame({ onBack, selectedLanguage, onLanguageChange, competitionMode = false }) {
  const t = UI_TEXT[selectedLanguage];

  const [items, setItems] = useState(() => loadItemsFromStorage(selectedLanguage));
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
  const [playMode, setPlayMode] = useState("sequential");
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [slotHighlight, setSlotHighlight] = useState(null); // lettera evidenziata durante spin

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const previousWrongCountRef = useRef(0);
  const remainingIndexesRef = useRef([]);

  const currentItem = items[currentIndex] || DEFAULT_ITEMS[0];
  const maxHearts = competitionMode ? 12 : (DIFFICULTY_HEARTS[currentItem.difficulty] || 8);
  const uniqueLetters = useMemo(() => getUniqueLetters(currentItem.text), [currentItem.text]);
  const missingConsonants = useMemo(() => {
    return uniqueLetters.filter(l => !VOWELS.has(l) && !guessed.has(l)).length;
  }, [uniqueLetters, guessed]);
  const masked = useMemo(() => maskCharacters(currentItem.text, guessed), [currentItem.text, guessed]);

  const buildRemainingPool = (itemsLength, excludeIndex = null) => {
    const indexes = Array.from({ length: itemsLength }, (_, i) => i).filter((i) => i !== excludeIndex);
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    return indexes;
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      // Italiano
      case "Facile": return t.hangman.easy;
      case "Media": return t.hangman.medium;
      case "Difficile": return t.hangman.hard;
      // Rumeno
      case "Ușor": return t.hangman.easy;
      case "Mediu": return t.hangman.medium;
      case "Dificil": return t.hangman.hard;
      // Inglese / Francese
      case "Easy": return t.hangman.easy;
      case "Medium": return t.hangman.medium;
      case "Hard": return t.hangman.hard;
      case "Facile_fr": return t.hangman.easy;
      case "Moyen": return t.hangman.medium;
      case "Difficile_fr": return t.hangman.hard;
      default: return difficulty;
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
    clearRoundState();
    inputRef.current?.focus();
  };

  const nextSequential = () => {
    if (items.length <= 1) {
      resetRound();
      return;
    }
    const next = currentIndex + 1 < items.length ? currentIndex + 1 : 0;
    setCurrentIndex(next);
    clearRoundState();
  };

  const nextRandom = () => {
    if (items.length <= 1) {
      resetRound();
      return;
    }
    if (remainingIndexesRef.current.length === 0) {
      remainingIndexesRef.current = buildRemainingPool(items.length, currentIndex);
    }
    const next = remainingIndexesRef.current.shift();
    if (next === undefined) {
      resetRound();
      return;
    }
    setCurrentIndex(next);
    clearRoundState();
  };

  const activateRandomMode = () => {
    setPlayMode("random");
    nextRandom();
  };

  const goNext = () => {
    if (playMode === "random") nextRandom();
    else nextSequential();
  };
  const goPrev = () => {
    const prev = currentIndex - 1 >= 0 ? currentIndex - 1 : items.length - 1;
    setCurrentIndex(prev);
    setPlayMode("sequential");
    remainingIndexesRef.current = buildRemainingPool(items.length, prev);
    clearRoundState();
  };


  const spinSlot = () => {
    if (slotSpinning || status !== "playing") return;

    // Lettere disponibili — escludo tutto ciò che è già stato estratto
    const allKeys = KEYBOARD_LAYOUTS[selectedLanguage].flat();
    const guessedArray = [...guessed];
    const available = allKeys.filter(k => !guessedArray.includes(k) && !wrong.includes(k));
    if (available.length === 0) return;

    // Probabilità pesata 60/40 — lettere presenti nella parola escono più spesso
    const presentLetters = available.filter(k => uniqueLetters.includes(k));
    const absentLetters = available.filter(k => !uniqueLetters.includes(k));

    let winner;
    if (presentLetters.length === 0) {
      winner = absentLetters[Math.floor(Math.random() * absentLetters.length)];
    } else if (absentLetters.length === 0) {
      winner = presentLetters[Math.floor(Math.random() * presentLetters.length)];
    } else {
      // 60% lettere presenti, 40% lettere assenti
      const pool = [
        ...presentLetters, ...presentLetters, ...presentLetters,  // peso 3x
        ...absentLetters, ...absentLetters,                        // peso 2x
      ];
      winner = pool[Math.floor(Math.random() * pool.length)];
    }

    setSlotSpinning(true);

    // Sequenza di intervalli: parte lento, accelera, poi rallenta prima della fine
    // Totale ~4 secondi
    const delays = [
      220, 200, 180, 160, 140, 120, 100, 90, 80, 80,  // accelera
      80, 80, 90, 100, 110, 130, 150, 180, 220, 280,  // rallenta
    ];
    let step = 0;

    const runStep = () => {
      if (step < delays.length) {
        // Mostra lettera random durante lo spin (solo tra quelle disponibili)
        const randomKey = available[Math.floor(Math.random() * available.length)];
        setSlotHighlight(randomKey);
        step++;
        setTimeout(runStep, delays[step - 1]);
      } else {
        // Fine spin — mostra vincitrice
        setSlotHighlight(winner);
        setTimeout(() => {
          setSlotHighlight(null);
          setSlotSpinning(false);
          handleGuess(winner);
        }, 600);
      }
    };

    runStep();
  };

  useEffect(() => {
    const allGuessed = uniqueLetters.length > 0 && uniqueLetters.every((l) => guessed.has(l));
    if (allGuessed) setStatus("won");
    else if (wrong.length >= maxHearts) setStatus("lost");
    else setStatus("playing");
  }, [guessed, uniqueLetters, wrong.length, maxHearts]);

  useEffect(() => {
    if (items.length > 0) {
      remainingIndexesRef.current = buildRemainingPool(items.length, currentIndex);
    }
  }, []);

  // Salva automaticamente le frasi nel browser ogni volta che cambiano
  useEffect(() => {
    saveItemsToStorage(selectedLanguage, items);
  }, [items, selectedLanguage]);

  // Quando cambia la lingua, carica le frasi salvate per quella lingua
  useEffect(() => {
    const loaded = loadItemsFromStorage(selectedLanguage);
    setItems(loaded);
    setCurrentIndex(0);
    remainingIndexesRef.current = buildRemainingPool(loaded.length, 0);
    clearRoundState();
  }, [selectedLanguage]);

  useEffect(() => {
    const prevWrong = previousWrongCountRef.current;
    if (wrong.length > prevWrong) {
      const lostIndex = maxHearts - wrong.length;
      setHeartBurstIndex(lostIndex);
      setBoardShake(true);
      setFlashMode("wrong");
      playTone(120, 0.40, "sawtooth");
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

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (status !== "playing") return;

      const key = event.key;

      if (!key || key.length !== 1) return;

      handleGuess(key);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [status, guessed, wrong]);

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
    const newIndex = items.length;
    const newItemsLength = items.length + 1;

    setItems((prev) => [...prev, newItem]);
    setCurrentIndex(newIndex);
    setPlayMode("sequential");
    remainingIndexesRef.current = buildRemainingPool(newItemsLength, newIndex);

    setCustomText("");
    setCustomHint("");
    setCustomDifficulty("Media");
    clearRoundState();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileName = file.name.toLowerCase();
      let parsed = [];

      if (fileName.endsWith(".csv")) {
        const text = await file.text();
        const workbook = XLSX.read(text, { type: "string", FS: text.includes(";") ? ";" : "," });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
        parsed = parseImportedRows(rows);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames.includes("Import_WebApp") ? "Import_WebApp" : workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
        parsed = parseImportedRows(rows);
      }

      if (parsed.length > 0) {
        setItems(parsed);
        saveItemsToStorage(selectedLanguage, parsed); // salva subito nella lingua corrente
        setCurrentIndex(0);
        setPlayMode("sequential");
        remainingIndexesRef.current = buildRemainingPool(parsed.length, 0);
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

  const hearts = Array.from({ length: maxHearts }, (_, i) => i < maxHearts - wrong.length);
  const hasAttempted = guessed.size > 0 || wrong.length > 0;
  const canGoNext = true; // sempre attivo: Avanti se non iniziato, Abbandona se iniziato

  return (
    <div className={`relative bg-[#1a3a2a] text-[#f0fdf4] ${compactMode ? "h-screen p-0 overflow-hidden" : "min-h-screen p-4 md:p-8"}`}>
      <style>{`img.twemoji-small { height: 0.9em; width: 0.9em; vertical-align: -0.12em; display: inline-block; }`}</style>

      <AnimatePresence>
        {flashMode === "wrong" ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="pointer-events-none absolute inset-0 z-30 bg-red-500" /> : null}
      </AnimatePresence>
      <AnimatePresence>
        {flashMode === "won" ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.30 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="pointer-events-none absolute inset-0 z-30 bg-emerald-400" /> : null}
      </AnimatePresence>

      <div className={`relative z-10 ${compactMode ? "w-full h-screen" : "mx-auto max-w-6xl"}`}>
        {compactMode ? (
          <motion.div
            animate={boardShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            style={{ width: "100%", height: "100vh", maxHeight: "100vh" }}
            className="flex flex-col rounded-[28px] border border-[#6a3520]/40 bg-white/5 shadow-2xl backdrop-blur-sm overflow-hidden"
          >
            {/* Riga 1 — Bottoni (altezza fissa ~52px) */}
            <div className="flex-none px-4 pt-3 pb-1">
              <TopControls onReset={resetRound} onRandom={activateRandomMode} onImport={() => fileInputRef.current?.click()} onDownloadTemplate={downloadTemplateFile} onFullscreen={toggleFullscreen} onToggleSound={() => setSoundOn((prev) => !prev)} fullscreenMode={fullscreenMode} soundOn={soundOn} compactMode={compactMode} onToggleCompact={() => setCompactMode((prev) => !prev)} fileInputRef={fileInputRef} handleImportFile={handleImportFile} onNext={goNext} onPrev={goPrev} hasAttempted={hasAttempted} onBack={onBack} onLanguageChange={onLanguageChange} currentLanguage={selectedLanguage} t={t} />
            </div>

            {/* Riga 2 — Progresso + difficoltà (altezza fissa ~28px) */}
            <div className="flex-none flex items-center justify-between px-5 py-1">
              <span className="text-[11px] text-[#d4956a] font-medium">{currentIndex + 1} / {items.length}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                ["Facile","Easy","Ușor"].includes(currentItem.difficulty) ? "bg-emerald-500/20 text-emerald-300" :
                ["Difficile","Hard","Dificil"].includes(currentItem.difficulty) ? "bg-rose-500/20 text-rose-300" :
                "bg-amber-500/20 text-amber-300"
              }`}>{getDifficultyLabel(currentItem.difficulty)}</span>
            </div>

            {/* Riga 3 — Indizio (altezza fissa ~90px) */}
            <div className="flex-none mx-4 rounded-3xl border border-[#6a3520]/40 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-cyan-500/20 px-5 py-3 text-center" style={{ minHeight: "60px", maxHeight: "90px" }}>
              {currentItem.category && (
                <div className="text-xs font-bold uppercase tracking-widest text-purple-300/90 mb-1">
                  {currentItem.category}
                </div>
              )}
              <div className="text-xl font-semibold leading-snug tracking-wide line-clamp-2">
                {renderHintWithEmoji(currentItem.hint)}
              </div>
            </div>

            {/* Riga 4 — Banner vocali (altezza fissa ~38px) */}
            <div className="flex-none mx-4 mt-2 rounded-2xl bg-rose-500/10 border border-rose-400/20 px-4 py-1.5 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{t.home.vowelBanner}</span>
            </div>

            {/* Riga 5 — Cuori + Robot + Pulsanti */}
            <div className="flex-none mx-4 mt-2 flex items-center justify-between" style={{ height: "18vh", minHeight: "100px", maxHeight: "150px" }}>
              {/* Cuori + stato a sinistra */}
              <div className="flex flex-col gap-1 w-36">
                <div className="flex items-center gap-1 flex-wrap">
                  {hearts.map((alive, idx) => {
                    const isBurst = heartBurstIndex === idx;
                    return (
                      <motion.div key={idx} initial={false} animate={alive ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 0.3 }} transition={{ duration: 0.2 }} className={`relative rounded-xl border px-1.5 py-0.5 ${alive ? "border-rose-400/50 bg-rose-500/20" : "border-[#6a3520] bg-[#1a0800]"}`}>
                        <Heart className={`h-3.5 w-3.5 ${alive ? "fill-rose-400 text-rose-300" : "text-[#8a4a2a]"}`} />
                        <AnimatePresence>
                          {isBurst ? <motion.div initial={{ scale: 0.4, opacity: 0.9 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="absolute inset-0 rounded-xl border-2 border-rose-300" /> : null}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
                <div className={`text-[11px] font-semibold ${status === "won" ? "text-emerald-400" : status === "lost" ? "text-rose-400" : "text-[#d4956a]"}`}>
                  {status === "playing" ? `${t.hangman.errors}: ${wrong.length}/${maxHearts}` : status === "won" ? `🎉 ${t.hangman.won}!` : `💀 ${t.hangman.lost}`}
                </div>
                {status === "playing" && (
                  <div className="text-[11px] font-semibold text-cyan-400 mt-0.5">
                    {t.home?.missingConsonants || "Consonanti"}: {missingConsonants}
                  </div>
                )}
              </div>

              {/* Robot al centro */}
              <div className="flex justify-center flex-1">
                <RobotArena wrongCount={wrong.length} maxHearts={maxHearts} isLost={status === "lost"} isWon={status === "won"} />
              </div>

              {/* Pulsanti a destra */}
              <div className="flex flex-col items-end gap-2 w-36">
                <button type="button" onClick={() => setShowAnswer((prev) => !prev)} className="rounded-lg bg-white/10 p-2 transition hover:bg-white/15" title={showAnswer ? t.hangman.hideSolution : t.hangman.showSolution}>
                  {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" onClick={goNext} className="rounded-lg px-3 py-2 text-xs font-bold transition bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg">
                  {t.hangman?.next || "Avanti"} →
                </button>
              </div>
            </div>

            {/* Riga 6 — Lettere (altezza fissa ~80px) */}
            <div className="flex-none mx-4 mt-2 rounded-3xl border border-[#6a3520]/40 bg-[#2a0f05]/60 p-2.5">
              <SolutionRow masked={masked} showAnswer={showAnswer} />
            </div>

            {/* Riga 7 — Tastiera (occupa il resto) */}
            <div className="flex-1 mx-4 mt-2 mb-3 min-h-0 flex flex-col gap-2">
              {competitionMode && (
                <div className="flex justify-center">
                  <motion.button
                    onClick={spinSlot}
                    disabled={slotSpinning || status !== "playing"}
                    whileHover={!slotSpinning ? { scale: 1.05 } : {}}
                    whileTap={!slotSpinning ? { scale: 0.95 } : {}}
                    className={`px-6 py-2 rounded-2xl font-black text-sm transition shadow-lg ${
                      slotSpinning
                        ? "bg-yellow-400 text-black animate-pulse cursor-not-allowed"
                        : status !== "playing"
                          ? "bg-white/10 text-[#b07050] cursor-not-allowed"
                          : "bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:from-yellow-300 hover:to-orange-300 shadow-yellow-500/30"
                    }`}
                  >
                    {slotSpinning ? "🎰 ..." : "🎰 Estrai lettera"}
                  </motion.button>
                </div>
              )}
              <div className="flex-1 min-h-0">
                <Keyboard guessed={guessed} wrong={wrong} onGuess={handleGuess} disabled={status !== "playing"} rows={KEYBOARD_LAYOUTS[selectedLanguage]} slotHighlight={slotHighlight} competitionMode={competitionMode} />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <motion.div animate={boardShake ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }} transition={{ duration: 0.4 }} className="rounded-3xl border border-[#6a3520]/40 bg-white/5 p-5 shadow-2xl backdrop-blur-sm md:p-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-pink-300/80">{t.hangman.liveGame}</p>
                  <h1 className="text-2xl font-bold md:text-4xl">{t.hangman.title}</h1>
                </div>
                <div className="mb-2 flex justify-center"><button onClick={onBack} className="text-xs text-[#d4956a] transition hover:text-white">{t.home.backToMenu}</button></div>
                <TopControls onReset={resetRound} onRandom={activateRandomMode} onImport={() => fileInputRef.current?.click()} onDownloadTemplate={downloadTemplateFile} onFullscreen={toggleFullscreen} onToggleSound={() => setSoundOn((prev) => !prev)} fullscreenMode={fullscreenMode} soundOn={soundOn} compactMode={compactMode} onToggleCompact={() => setCompactMode((prev) => !prev)} fileInputRef={fileInputRef} handleImportFile={handleImportFile} onNext={goNext} onPrev={goPrev} hasAttempted={hasAttempted} onBack={onBack} onLanguageChange={onLanguageChange} currentLanguage={selectedLanguage} t={t} />
              </div>

              <div className="mb-5 rounded-3xl border border-[#6a3520]/40 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-cyan-500/20 p-4">
                <div>
                  {currentItem.category && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300/70 mb-0.5">{currentItem.category}</p>
                )}
                <p className="mb-2 text-sm text-[#f0c8a0]">{t.hangman.clue}</p>
                  <p className="text-xl md:text-2xl font-semibold leading-relaxed tracking-wide" style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Segoe UI", sans-serif' }} dangerouslySetInnerHTML={{ __html: twemoji.parse(currentItem.hint, { folder: "svg", ext: ".svg", className: "twemoji-small" }) }} />
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {hearts.map((alive, idx) => {
                  const isBurst = heartBurstIndex === idx;
                  return (
                    <motion.div key={idx} initial={false} animate={alive ? { scale: [1, 1.08, 1] } : { scale: 1, opacity: 0.45 }} transition={{ duration: 0.35 }} className={`relative rounded-2xl border px-3 py-2 ${alive ? "border-rose-400/40 bg-rose-500/15" : "border-[#6a3520] bg-[#1a0800] opacity-40"}`}>
                      <Heart className={`h-5 w-5 ${alive ? "fill-rose-400 text-rose-300" : "text-[#b07050]"}`} />
                      <AnimatePresence>
                        {isBurst ? <motion.div initial={{ scale: 0.4, opacity: 0.9 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 rounded-2xl border-2 border-rose-300" /> : null}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mb-4 flex w-full items-center justify-between">
                <div className="flex-1" />

                <div className="flex flex-1 justify-center">
                  <RobotArena
                    wrongCount={wrong.length}
                    maxHearts={maxHearts}
                    isLost={status === "lost"}
                    isWon={status === "won"}
                  />
                </div>

                <div className="flex flex-1 flex-col items-end gap-2.5">
                  <button
                    onClick={() => setShowAnswer((prev) => !prev)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs transition hover:bg-white/15"
                  >
                    {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAnswer ? t.hangman.hideSolution : t.hangman.showSolution}
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition bg-cyan-500/80 text-white hover:bg-cyan-500"
                  >
                    {t.hangman?.next || "Avanti"}
                  </button>
                </div>
              </div>

              <div className="mb-4 rounded-3xl border border-[#6a3520]/40 bg-black/20 p-3">
                <SolutionRow masked={masked} showAnswer={showAnswer} />
              </div>
              <div className="rounded-3xl border border-[#6a3520]/40 bg-black/20 p-4"><Keyboard guessed={[...guessed]} wrong={wrong} onGuess={handleGuess} disabled={status !== "playing"} rows={KEYBOARD_LAYOUTS[selectedLanguage]} /></div>
            </motion.div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-[#6a3520]/40 bg-white/5 p-5 shadow-2xl">
                <h2 className="mb-4 text-xl font-bold">{t.hangman.addItemTitle}</h2>
                <div className="space-y-3">
                  <input value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder={t.hangman.itemPlaceholder} className="w-full rounded-2xl border border-[#6a3520]/40 bg-black/20 px-4 py-3 outline-none focus:border-pink-400" />
                  <textarea value={customHint} onChange={(event) => setCustomHint(event.target.value)} placeholder={t.hangman.cluePlaceholder} rows={4} className="w-full resize-none rounded-2xl border border-[#6a3520]/40 bg-black/20 px-4 py-3 outline-none focus:border-pink-400" />
                  <select value={customDifficulty} onChange={(event) => setCustomDifficulty(event.target.value)} className="w-full rounded-2xl border border-[#6a3520]/40 bg-black/20 px-4 py-3 outline-none focus:border-pink-400">
                    <option value="Facile">{t.hangman.easy}</option>
                    <option value="Media">{t.hangman.medium}</option>
                    <option value="Difficile">{t.hangman.hard}</option>
                  </select>
                  <button onClick={addCustomItem} className="w-full rounded-2xl bg-emerald-500/80 px-4 py-3 font-semibold hover:bg-emerald-500">{t.hangman.addAndPlay}</button>
                </div>
              </div>

              <div className="rounded-3xl border border-[#6a3520]/40 bg-white/5 p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">{t.hangman.archiveTitle}</h2>
                  <button
                    onClick={() => {
                      const defaults = DEFAULT_ITEMS_BY_LANG[selectedLanguage] || DEFAULT_ITEMS_IT;
                      setItems(defaults);
                      setCurrentIndex(0);
                      remainingIndexesRef.current = buildRemainingPool(defaults.length, 0);
                      clearRoundState();
                      saveItemsToStorage(selectedLanguage, defaults);
                    }}
                    className="text-[10px] text-[#b07050] hover:text-rose-400 transition rounded-lg px-2 py-1 hover:bg-rose-500/10"
                    title="Cancella lista e torna ai default"
                  >
                    🗑 reset
                  </button>
                </div>
                <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                  {items.map((item, idx) => (
                    <button key={`${idx}-${item.difficulty}`} onClick={() => { setCurrentIndex(idx); setPlayMode("sequential"); remainingIndexesRef.current = buildRemainingPool(items.length, idx); clearRoundState(); }} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${idx === currentIndex ? "border-pink-400/40 bg-pink-500/15" : "border-[#6a3520]/40 bg-black/20 hover:bg-white/10"}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#d4956a] uppercase tracking-wider">{t.hangman.roundLabel} {idx + 1}</div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${["Facile","Easy","Ușor"].includes(item.difficulty) ? "bg-emerald-500/20 text-emerald-300" : ["Difficile","Hard","Dificil"].includes(item.difficulty) ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"}`}>{getDifficultyLabel(item.difficulty)}</span>
                          <span className="text-[10px] text-[#b07050]">{item.text.replace(/ /g, "").length} {selectedLanguage === "it" ? "lett." : "ltrs"}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-[#fff1ee] truncate">{item.hint}</div>
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

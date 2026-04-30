import React, { useState } from "react";
import HangmanGame from "./HangmanGame";
import MastermindGame from "./MastermindGame";
import NumberGame from "./NumberGame";
import WordChainGame from "./WordChainGame";
import { UI_TEXT } from "./texts/uiText";

export default function App() {

  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("it");

  const t = UI_TEXT[selectedLanguage];

  if (selectedGame === "hangman") {
    return <HangmanGame onBack={() => setSelectedGame(null)} selectedLanguage={selectedLanguage} />;
  }
  if (selectedGame === "mastermind") {
    return <MastermindGame onBack={() => setSelectedGame(null)} selectedLanguage={selectedLanguage} />;
  }
  if (selectedGame === "numbergame") {
    return <NumberGame onBack={() => setSelectedGame(null)} selectedLanguage={selectedLanguage} />;
  }
  if (selectedGame === "wordchain") {
    return <WordChainGame onBack={() => setSelectedGame(null)} selectedLanguage={selectedLanguage} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4 py-8">
      <div className="w-full max-w-md">

        {/* Titolo + lingua */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.home.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{t.home.subtitle}</p>
          </div>
          <div className="flex gap-1.5">
            {[
              { code: "it", img: "https://flagcdn.com/w40/it.png", label: "IT" },
              { code: "en", img: "https://flagcdn.com/w40/gb.png", label: "EN" },
              { code: "fr", img: "https://flagcdn.com/w40/fr.png", label: "FR" },
              { code: "ro", img: "https://flagcdn.com/w40/ro.png", label: "RO" },
            ].map(({ code, img, label }) => (
              <button
                key={code}
                onClick={() => setSelectedLanguage(code)}
                title={label}
                className={`rounded-xl p-1.5 transition ${
                  selectedLanguage === code
                    ? "bg-white/20 ring-2 ring-white/40"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <img src={img} alt={label} className="h-6 w-9 rounded-sm object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Card giochi */}
        <div className="flex flex-col gap-3">

          {/* Impiccato */}
          <button
            onClick={() => setSelectedGame("hangman")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg transition duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.games.hangmanOverlay} opacity-0 transition duration-200 group-hover:opacity-80`} />
            <div className="relative z-10 flex items-center gap-4">

              {/* Icona */}
              <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.games.hangmanIconBg} text-2xl shadow-md transition duration-200 group-hover:scale-110`}>
                {t.games.hangmanIcon}
              </div>

              {/* Testo */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{t.games.hangmanTitle}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{t.games.hangmanDesc}</div>
              </div>

              {/* Freccia */}
              <div className="flex-shrink-0 rounded-lg bg-cyan-500/70 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-cyan-500">
                {t.home.open} →
              </div>
            </div>
          </button>

          {/* Indovina il Numero */}
          <button
            onClick={() => setSelectedGame("numbergame")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg transition duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.games.numbergameOverlay} opacity-0 transition duration-200 group-hover:opacity-80`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.games.numbergameIconBg} text-2xl shadow-md transition duration-200 group-hover:scale-110`}>
                🔢
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{t.games.numbergameTitle}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{t.games.numbergameDesc}</div>
              </div>
              <div className="flex-shrink-0 rounded-lg bg-cyan-500/70 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-cyan-500">
                {t.home.open} →
              </div>
            </div>
          </button>

          {/* Catena di Parole */}
          <button
            onClick={() => setSelectedGame("wordchain")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg transition duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.games.wordchainOverlay} opacity-0 transition duration-200 group-hover:opacity-80`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.games.wordchainIconBg} text-2xl shadow-md transition duration-200 group-hover:scale-110`}>
                🔗
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{t.games.wordchainTitle}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{t.games.wordchainDesc}</div>
              </div>
              <div className="flex-shrink-0 rounded-lg bg-cyan-500/70 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-cyan-500">
                {t.home.open} →
              </div>
            </div>
          </button>

          {/* Mastermind */}
          <button
            onClick={() => setSelectedGame("mastermind")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg transition duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.games.mastermindOverlay} opacity-0 transition duration-200 group-hover:opacity-80`} />
            <div className="relative z-10 flex items-center gap-4">

              {/* Icona */}
              <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.games.mastermindIconBg} shadow-md transition duration-200 group-hover:scale-110`}>
                <div className="grid grid-cols-2 gap-1 bg-black/25 px-1.5 py-1 rounded-md">
                  {t.games.mastermindIconDots.map((dotClass, index) => (
                    <div
                      key={index}
                      className={`h-3 w-3 rounded-full ${dotClass} transition duration-200 group-hover:scale-110`}
                      style={{ transitionDelay: `${index * 70}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Testo */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{t.games.mastermindTitle}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{t.games.mastermindDesc}</div>
              </div>

              {/* Freccia */}
              <div className="flex-shrink-0 rounded-lg bg-cyan-500/70 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-cyan-500">
                {t.home.open} →
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}

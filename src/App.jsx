import React, { useState } from "react";
import HangmanGame from "./HangmanGame";
import SecretWordGame from "./SecretWordGame";
import MastermindGame from "./MastermindGame";
import { UI_TEXT } from "./texts/uiText";

export default function App() {

  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("it");

  const t = UI_TEXT[selectedLanguage];

  if (selectedGame === "hangman") {
    return <HangmanGame onBack={() => setSelectedGame(null)} selectedLanguage={selectedLanguage} />;
  }
  if (selectedGame === "secretword") {
    return <SecretWordGame onBack={() => setSelectedGame(null)} selectedLanguage={selectedLanguage} />;
  }
  if (selectedGame === "mastermind") {
    return <MastermindGame onBack={() => setSelectedGame(null)} selectedLanguage={selectedLanguage} />;
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
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="it">🇮🇹 IT</option>
            <option value="en">🇬🇧 EN</option>
            <option value="fr">🇫🇷 FR</option>
            <option value="ro">🇷🇴 RO</option>
          </select>
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

          {/* Parola Segreta */}
          <button
            onClick={() => setSelectedGame("secretword")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg transition duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.games.secretwordOverlay} opacity-0 transition duration-200 group-hover:opacity-80`} />
            <div className="relative z-10 flex items-center gap-4">

              {/* Icona */}
              <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.games.secretwordIconBg} shadow-md transition duration-200 group-hover:scale-110`}>
                <div className="flex gap-1 bg-black/20 px-1.5 py-1 rounded-md">
                  {t.games.secretwordIconCells.map((cellClass, index) => (
                    <div
                      key={index}
                      className={`h-3 w-3 rounded-sm ${cellClass} transition duration-200 group-hover:-translate-y-0.5`}
                      style={{ transitionDelay: `${index * 70}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Testo */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{t.games.secretwordTitle}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{t.games.secretwordDesc}</div>
              </div>

              {/* Freccia */}
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

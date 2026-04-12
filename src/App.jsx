import React, { useState } from "react";
import HangmanGame from "./HangmanGame";
import SecretWordGame from "./SecretWordGame";
import MastermindGame from "./MastermindGame";
import { UI_TEXT } from "./texts/uiText";

export default function App() {

  const [selectedGame, setSelectedGame] = useState(null);

  // ✅ QUESTA RIGA È FONDAMENTALE
  const [selectedLanguage, setSelectedLanguage] = useState("it");

  const t = UI_TEXT[selectedLanguage];

  if (selectedGame === "hangman") {
    return (
      <HangmanGame
        onBack={() => setSelectedGame(null)}
        selectedLanguage={selectedLanguage}
      />
    );
  }

  if (selectedGame === "secretword") {
    return (
      <SecretWordGame
        onBack={() => setSelectedGame(null)}
        selectedLanguage={selectedLanguage}
      />
    );
  }

  if (selectedGame === "mastermind") {
    return (
      <MastermindGame
        onBack={() => setSelectedGame(null)}
        selectedLanguage={selectedLanguage}
      />
    );
  }
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex flex-col items-center gap-4">
          <h1 className="text-center text-3xl font-bold md:text-4xl">{t.home.title}</h1>
          <p className="max-w-xl text-center text-slate-300">{t.home.subtitle}</p>

          <div className="flex items-center justify-center gap-2">
            <label className="text-sm text-slate-300">{t.home.languageLabel}:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ro">Română</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 w-full max-w-xl mx-auto">
          <button
            onClick={() => setSelectedGame("hangman")}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-xl transition duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${t.games.hangmanOverlay} opacity-0 transition duration-200 group-hover:opacity-80`} />

            <div className="relative z-10 flex flex-col items-start">
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${t.games.hangmanIconBg} text-2xl shadow-lg transition duration-200 group-hover:scale-110 group-hover:shadow-[0_0_18px_rgba(34,211,238,0.45)]`}>
                {t.games.hangmanIcon}
              </div>

              <div className="text-xl font-bold text-white">
                {t.games.hangmanTitle}
              </div>

              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                {t.games.hangmanDesc}
              </div>

              <div className="mt-5 inline-flex items-center rounded-xl bg-cyan-500/80 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-cyan-500">
                {t.home.open}
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame("secretword")}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-xl transition duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${t.games.secretwordOverlay} opacity-0 transition duration-200 group-hover:opacity-80`} />

            <div className="relative z-10 flex flex-col items-start">
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${t.games.secretwordIconBg} shadow-lg transition duration-200 group-hover:scale-110 group-hover:shadow-[0_0_18px_rgba(132,204,22,0.45)]`}>

                <div className="flex gap-1 bg-black/20 px-2 py-1 rounded-lg">
                  {t.games.secretwordIconCells.map((cellClass, index) => (
                    <div
                      key={index}
                      className={`h-3.5 w-3.5 rounded-sm ${cellClass} transition duration-200 group-hover:-translate-y-0.5`}
                      style={{ transitionDelay: `${index * 70}ms` }}
                    />
                  ))}
                </div>

              </div>
              <div className="text-xl font-bold text-white">
                {t.games.secretwordTitle}
              </div>

              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                {t.games.secretwordDesc}
              </div>

              <div className="mt-5 inline-flex items-center rounded-xl bg-cyan-500/80 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-cyan-500">
                {t.home.open}
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame("mastermind")}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-xl transition duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${t.games.mastermindOverlay} opacity-0 transition duration-200 group-hover:opacity-80`} />

            <div className="relative z-10 flex flex-col items-start">
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${t.games.mastermindIconBg} shadow-lg transition duration-200 group-hover:scale-110 group-hover:shadow-[0_0_22px_rgba(168,85,247,0.6)]`}>

                <div className="grid grid-cols-2 gap-1 bg-black/25 px-2 py-1 rounded-lg">
                  {t.games.mastermindIconDots.map((dotClass, index) => (
                    <div
                      key={index}
                      className={`h-3.5 w-3.5 rounded-full ${dotClass} transition duration-200 group-hover:scale-110`}
                      style={{ transitionDelay: `${index * 70}ms` }}
                    />
                  ))}
                </div>

              </div>
              <div className="text-xl font-bold text-white">
                {t.games.mastermindTitle}
              </div>

              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                {t.games.mastermindDesc}
              </div>

              <div className="mt-5 inline-flex items-center rounded-xl bg-cyan-500/80 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-cyan-500">
                {t.home.open}
              </div>
            </div>
          </button>
        </div>
      </div >
    </div >
  );
}
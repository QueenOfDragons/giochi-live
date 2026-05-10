import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, Gamepad2, Plus, Minus, X, ChevronRight, Gift, Star } from "lucide-react";
import HangmanGame from "./HangmanGame";
import MastermindGame from "./MastermindGame";
import NumberGame from "./NumberGame";
import BersaglioGame from "./BersaglioGame";
import { UI_TEXT } from "./texts/uiText";

// ── Colori giocatori ──────────────────────────────────────────────────────────
const PLAYER_COLORS = [
  { bg: "bg-rose-500",    ring: "ring-rose-400",    text: "text-rose-300",    hex: "#f43f5e", name: "Rosso"   },
  { bg: "bg-blue-500",    ring: "ring-blue-400",    text: "text-blue-300",    hex: "#3b82f6", name: "Blu"     },
  { bg: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-300", hex: "#10b981", name: "Verde"   },
  { bg: "bg-yellow-400",  ring: "ring-yellow-300",  text: "text-yellow-300",  hex: "#facc15", name: "Giallo"  },
  { bg: "bg-violet-500",  ring: "ring-violet-400",  text: "text-violet-300",  hex: "#8b5cf6", name: "Viola"   },
  { bg: "bg-orange-500",  ring: "ring-orange-400",  text: "text-orange-300",  hex: "#f97316", name: "Arancio" },
];

// Conversione donazioni non lineare — diminishing returns
// protegge dal pay-to-win lasciando impatto reale alle donazioni piccole
const coinsToPoints = (coins) => {
  if (coins > 10000)  return 50;
  if (coins >= 10000) return 30;
  if (coins >= 5000)  return 20;
  if (coins >= 1000)  return 7;
  if (coins >= 500)   return 4;
  if (coins >= 100)   return 1;
  return 0;
};

// ── Scoreboard tra round ─────────────────────────────────────────────────────
function CompetitionScoreboard({ players, onAddPoint, onAddDonation, onNextRound, onEndCompetition, currentRound, totalRounds, t }) {
  const [donationInput, setDonationInput] = useState({});

  // Guardia — se players non è valido non renderizzare
  if (!players || players.length === 0) return null;

  const sorted = [...players].sort((a, b) => (b.points + coinsToPoints(b.coins)) - (a.points + coinsToPoints(a.coins)));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span className="font-black text-white text-lg">{t.competition.bannerLabel}</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            Round {currentRound} / {totalRounds}
          </span>
        </div>

        {/* Classifica */}
        <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {sorted.map((player, rank) => {
            const bonusPoints = coinsToPoints(player.coins);
            const total = player.points + bonusPoints;
            const color = PLAYER_COLORS[player.colorIdx];
            return (
              <div key={player.id} className={`rounded-2xl border ${rank === 0 ? "border-yellow-400/40 bg-yellow-500/10" : "border-white/10 bg-white/5"} p-3`}>
                <div className="flex items-center gap-3">
                  {/* Posizione */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-sm ${rank === 0 ? "bg-yellow-400 text-black" : rank === 1 ? "bg-slate-400 text-black" : rank === 2 ? "bg-orange-600 text-white" : "bg-white/10 text-slate-300"}`}>
                    {rank + 1}
                  </div>
                  {/* Nome */}
                  <div className={`h-3 w-3 rounded-full ${color.bg}`} />
                  <span className="font-bold text-white flex-1 text-sm">{player.name}</span>
                  {/* Punteggi */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-slate-400">{t.competition.scoreGame}</div>
                      <div className="font-black text-white">{player.points}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400">{t.competition.scoreCoins}</div>
                      <div className={`font-black ${color.text}`}>{player.coins}</div>
                    </div>
                    <div className="text-center border-l border-white/20 pl-3">
                      <div className="text-slate-400">{t.competition.scoreTotal}</div>
                      <div className="font-black text-yellow-400 text-base">{total}</div>
                    </div>
                  </div>
                </div>

                {/* Azioni */}
                <div className="mt-2 flex gap-2">
                  {/* +1 punto */}
                  <button onClick={() => onAddPoint(player.id)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition">
                    <Star className="h-3 w-3" /> {t.competition.addPoint}
                  </button>
                  {/* Donazione */}
                  <div className="flex-1 flex gap-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="monete"
                      value={donationInput[player.id] || ""}
                      onChange={e => setDonationInput(prev => ({ ...prev, [player.id]: e.target.value }))}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white outline-none text-center"
                    />
                    <button
                      onClick={() => {
                        const val = parseInt(donationInput[player.id] || "0");
                        if (val > 0) {
                          onAddDonation(player.id, val);
                          setDonationInput(prev => ({ ...prev, [player.id]: "" }));
                        }
                      }}
                      className="rounded-xl bg-rose-500/20 border border-rose-400/30 px-2 py-1.5 hover:bg-rose-500/30 transition">
                      <Gift className="h-3 w-3 text-rose-300" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info conversione */}
        <div className="px-4 py-2">
          <div className="text-[10px] text-slate-500 text-center mb-1">💰 Conversione donazioni</div>
          <div className="grid grid-cols-5 gap-1 text-center">
            {[[100,1],[500,4],[1000,7],[5000,20],[10000,30]].map(([coins, pts]) => (
              <div key={coins} className="rounded-lg bg-white/5 py-1">
                <div className="text-[9px] text-slate-400 font-bold">{coins >= 1000 ? (coins/1000)+"K" : coins}</div>
                <div className="text-[10px] font-black text-yellow-400">{pts}pt</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottoni */}
        <div className="p-4 flex gap-3 border-t border-white/10">
          {currentRound < totalRounds ? (
            <motion.button onClick={onNextRound} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-bold text-white shadow-lg">
              <ChevronRight className="h-4 w-4" /> Round {currentRound + 1}
            </motion.button>
          ) : (
            <motion.button onClick={onEndCompetition} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 py-3 font-bold text-white shadow-lg">
              <Trophy className="h-4 w-4" /> Finale!
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Podio finale ──────────────────────────────────────────────────────────────
function CompetitionPodium({ players, onClose, t }) {
  if (!players || players.length === 0) return null;

  const sorted = [...players].sort((a, b) => {
    const totalA = a.points + Math.floor(a.coins / COINS_PER_POINT);
    const totalB = b.points + Math.floor(b.coins / COINS_PER_POINT);
    return totalB - totalA;
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl border border-yellow-400/30 bg-slate-900 shadow-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 px-5 py-5 text-center border-b border-white/10">
          <div className="text-4xl mb-1">🏆</div>
          <div className="text-2xl font-black text-yellow-400">{t.competition.finalTitle}</div>
        </div>

        <div className="p-5 space-y-3">
          {sorted.map((player, rank) => {
            const bonusPoints = coinsToPoints(player.coins);
            const total = player.points + bonusPoints;
            const color = PLAYER_COLORS[player.colorIdx];
            return (
              <motion.div key={player.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rank * 0.15 }}
                className={`rounded-2xl border p-4 ${rank === 0 ? "border-yellow-400/50 bg-yellow-500/15" : "border-white/10 bg-white/5"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medals[rank] || `${rank + 1}.`}</span>
                  <div className={`h-4 w-4 rounded-full ${color.bg} flex-shrink-0`} />
                  <span className="font-black text-white flex-1">{player.name}</span>
                  <div className="text-right">
                    <div className="text-xl font-black text-yellow-400">{total} pt</div>
                    <div className="text-[10px] text-slate-500">
                      {player.points} gioco + {player.coins} monete
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <motion.button onClick={onClose} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 py-3 font-bold text-white">
            Torna al menu
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Setup competizione ────────────────────────────────────────────────────────
function CompetitionSetup({ onStart, onBack, t }) {
  const [players, setPlayers] = useState([
    { id: 1, name: "", colorIdx: 0 },
    { id: 2, name: "", colorIdx: 1 },
  ]);
  const [rounds, setRounds] = useState(10);
  const [selectedGame, setSelectedGame] = useState("hangman");

  const addPlayer = () => {
    if (players.length >= 6) return;
    const usedColors = players.map(p => p.colorIdx);
    const nextColor = [0,1,2,3,4,5].find(c => !usedColors.includes(c)) ?? players.length;
    setPlayers(prev => [...prev, { id: Date.now(), name: "", colorIdx: nextColor }]);
  };
  const removePlayer = (id) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter(p => p.id !== id));
  };
  const updateName = (id, name) => setPlayers(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  const updateColor = (id, colorIdx) => setPlayers(prev => prev.map(p => p.id === id ? { ...p, colorIdx } : p));

  const canStart = players.every(p => p.name.trim().length > 0) && rounds >= 1;

  const games = [
    { id: "hangman",    label: "Impiccato",          icon: "🤖" },
    { id: "bersaglio",  label: "Il Bersaglio",        icon: "🎯" },
    { id: "numbergame", label: "Indovina il Numero",  icon: "🔢" },
    { id: "mastermind", label: "Mastermind",          icon: "🎨" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <button onClick={onBack} className="text-xs text-slate-400 hover:text-white transition">← Menu</button>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h1 className="text-xl font-black text-white">{t.competition.title}</h1>
          </div>
        </div>

        {/* Gioco */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">{t.competition.scoreGame}</div>
          <div className="grid grid-cols-2 gap-2">
            {games.map(g => (
              <button key={g.id} onClick={() => setSelectedGame(g.id)}
                className={`rounded-xl p-3 text-left text-sm font-bold transition border ${selectedGame === g.id ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Round */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">{t.competition.rounds}</div>
          <div className="flex items-center gap-4 justify-center">
            <button onClick={() => setRounds(r => Math.max(1, r - 1))}
              className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 transition flex items-center justify-center">
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-3xl font-black text-white w-12 text-center">{rounds}</span>
            <button onClick={() => setRounds(r => Math.min(30, r + 1))}
              className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 transition flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Giocatori */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Giocatori ({players.length}/6)
            </div>
            {players.length < 6 && (
              <button onClick={addPlayer}
                className="flex items-center gap-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/30 transition">
                <Plus className="h-3 w-3" /> Aggiungi
              </button>
            )}
          </div>

          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-2">
                {/* Selettore colore */}
                <div className="flex gap-1">
                  {PLAYER_COLORS.map((c, idx) => (
                    <button key={idx} onClick={() => updateColor(player.id, idx)}
                      className={`h-5 w-5 rounded-full ${c.bg} transition ${player.colorIdx === idx ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110" : "opacity-50 hover:opacity-80"}`}
                    />
                  ))}
                </div>
                {/* Nome */}
                <input
                  type="text"
                  placeholder={`${t.competition.playerPlaceholder} ${players.indexOf(player) + 1}`}
                  value={player.name}
                  onChange={e => updateName(player.id, e.target.value)}
                  maxLength={20}
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/20"
                />
                {/* Rimuovi */}
                {players.length > 2 && (
                  <button onClick={() => removePlayer(player.id)}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-rose-500/20 transition flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-slate-400 hover:text-rose-300" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info conversione — tabellina */}
        <div className="mb-4 rounded-2xl bg-yellow-500/10 border border-yellow-400/20 p-3">
          <div className="text-xs font-semibold text-yellow-300 mb-2 text-center">💰 Conversione Donazioni</div>
          <div className="grid grid-cols-5 gap-1 text-center">
            {[[100,1],[500,4],[1000,7],[5000,20],[10000,30]].map(([coins, pts]) => (
              <div key={coins} className="rounded-lg bg-yellow-500/10 py-1.5 px-1">
                <div className="text-[10px] text-yellow-200 font-bold">{coins >= 1000 ? (coins/1000)+"K" : coins}</div>
                <div className="text-[9px] text-slate-400">monete</div>
                <div className="text-sm font-black text-yellow-400">{pts}</div>
                <div className="text-[9px] text-slate-400">pt</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 text-center mt-2">{t.competition.conversionNote}</div>
        </div>

        {/* Start */}
        <motion.button
          onClick={() => canStart && onStart({ players: players.map(p => ({ ...p, points: 0, coins: 0 })), rounds, selectedGame })}
          disabled={!canStart}
          whileHover={canStart ? { scale: 1.03 } : {}}
          whileTap={canStart ? { scale: 0.97 } : {}}
          className={`w-full rounded-2xl py-4 font-black text-lg transition ${canStart ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30" : "bg-white/5 text-slate-600 cursor-not-allowed"}`}>
          {t.competition.start}
        </motion.button>
      </div>
    </div>
  );
}

// ── App principale ────────────────────────────────────────────────────────────
export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState("it");
  const [mode, setMode] = useState(null); // null | "live" | "competition-setup" | "competition"
  const [selectedGame, setSelectedGame] = useState(null);

  // Stato competizione
  const [competition, setCompetition] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showPodium, setShowPodium] = useState(false);

  const t = UI_TEXT[selectedLanguage];

  // ── Handlers competizione ──────────────────────────────────────────────────
  const startCompetition = ({ players, rounds, selectedGame: game }) => {
    setCompetition({ players, rounds });
    setCurrentRound(1);
    setSelectedGame(game);
    setMode("competition");
    setShowScoreboard(false);
    setShowPodium(false);
  };

  const addPoint = (playerId) => {
    setCompetition(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === playerId ? { ...p, points: p.points + 1 } : p)
    }));
  };

  const addDonation = (playerId, coins) => {
    setCompetition(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === playerId ? { ...p, coins: p.coins + coins } : p)
    }));
  };

  const nextRound = () => {
    setCurrentRound(r => r + 1);
    setShowScoreboard(false);
  };

  const endCompetition = () => {
    setShowScoreboard(false);
    setShowPodium(true);
  };

  const resetAll = () => {
    setMode(null);
    setSelectedGame(null);
    setCompetition(null);
    setCurrentRound(1);
    setShowScoreboard(false);
    setShowPodium(false);
  };

  // ── Routing ────────────────────────────────────────────────────────────────

  // Modalità competizione — gioco attivo
  if (mode === "competition" && selectedGame && !showScoreboard && !showPodium) {
    const GameComponent = {
      hangman: HangmanGame,
      mastermind: MastermindGame,
      numbergame: NumberGame,
      bersaglio: BersaglioGame,
    }[selectedGame];

    return (
      <div className="relative">
        <GameComponent
          onBack={() => setShowScoreboard(true)}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          competitionMode={true}
        />
        {/* Banner competizione */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <button onClick={() => setShowScoreboard(true)}
            className="flex items-center gap-2 rounded-2xl bg-yellow-500/90 backdrop-blur px-4 py-2 text-sm font-bold text-black shadow-lg shadow-yellow-500/30 hover:bg-yellow-400 transition">
            <Trophy className="h-4 w-4" />
            Round {currentRound}/{competition?.rounds} — Classifica
          </button>
        </div>
      </div>
    );
  }

  // Scoreboard
  if (mode === "competition" && showScoreboard && !showPodium) {
    return (
      <CompetitionScoreboard
        players={competition.players}
        t={t}
        onAddPoint={addPoint}
        onAddDonation={addDonation}
        onNextRound={nextRound}
        onEndCompetition={endCompetition}
        currentRound={currentRound}
        totalRounds={competition.rounds}
      />
    );
  }

  // Podio
  if (showPodium) {
    return <CompetitionPodium players={competition.players} onClose={resetAll} t={t} />;
  }

  // Setup competizione
  if (mode === "competition-setup") {
    return <CompetitionSetup onStart={startCompetition} onBack={() => setMode(null)} t={t} />;
  }

  // Modalità live — gioco attivo
  if (mode === "live" && selectedGame) {
    const GameComponent = {
      hangman: HangmanGame,
      mastermind: MastermindGame,
      numbergame: NumberGame,
      bersaglio: BersaglioGame,
    }[selectedGame];
    return <GameComponent onBack={() => setSelectedGame(null)} selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />;
  }

  // ── Menu principale ────────────────────────────────────────────────────────
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
              { code: "it", img: "https://hatscripts.github.io/circle-flags/flags/it.svg", label: "IT" },
              { code: "en", img: "https://hatscripts.github.io/circle-flags/flags/gb.svg", label: "EN" },
              { code: "fr", img: "https://hatscripts.github.io/circle-flags/flags/fr.svg", label: "FR" },
              { code: "ro", img: "https://hatscripts.github.io/circle-flags/flags/ro.svg", label: "RO" },
            ].map(({ code, img, label }) => (
              <button key={code} onClick={() => setSelectedLanguage(code)} title={label}
                className={`rounded-xl p-1.5 transition ${selectedLanguage === code ? "bg-white/20 ring-2 ring-white/40" : "bg-white/5 hover:bg-white/10"}`}>
                <img src={img} alt={label} className="h-6 w-9 rounded-sm object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Scelta modalità */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button onClick={() => setMode("live")}
            className={`rounded-2xl border p-4 text-left transition ${mode === "live" ? "border-cyan-400/50 bg-cyan-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
            <div className="text-2xl mb-1">🎮</div>
            <div className="font-bold text-white text-sm">{t.competition.modeLive}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t.competition.modeLiveDesc}</div>
          </button>
          <button onClick={() => setMode("competition-setup")}
            className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-left hover:bg-yellow-500/15 transition">
            <div className="text-2xl mb-1">🏆</div>
            <div className="font-bold text-yellow-300 text-sm">{t.competition.modeComp}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t.competition.modeCompDesc}</div>
          </button>
        </div>

        {/* Card giochi — solo in modalità live */}
        {mode === "live" && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3">
              {[
                { id: "hangman",    icon: t.games.hangmanIcon,  bg: t.games.hangmanIconBg,    overlay: t.games.hangmanOverlay,    title: t.games.hangmanTitle,    desc: t.games.hangmanDesc },
                { id: "numbergame", icon: "🔢",                  bg: t.games.numbergameIconBg,  overlay: t.games.numbergameOverlay, title: t.games.numbergameTitle, desc: t.games.numbergameDesc },
                { id: "bersaglio",  icon: "🎯",                  bg: t.games.bersaglioIconBg,   overlay: t.games.bersaglioOverlay,  title: t.games.bersaglioTitle,  desc: t.games.bersaglioDesc },
                { id: "mastermind", icon: null,                  bg: t.games.mastermindIconBg,  overlay: t.games.mastermindOverlay, title: t.games.mastermindTitle, desc: t.games.mastermindDesc },
              ].map(game => (
                <button key={game.id} onClick={() => setSelectedGame(game.id)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg transition duration-200 hover:scale-[1.02] hover:bg-white/10">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${game.overlay} opacity-0 transition duration-200 group-hover:opacity-80`} />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${game.bg} text-2xl shadow-md transition duration-200 group-hover:scale-110`}>
                      {game.id === "mastermind" ? (
                        <div className="grid grid-cols-2 gap-1 bg-black/25 px-1.5 py-1 rounded-md">
                          {t.games.mastermindIconDots.map((dotClass, index) => (
                            <div key={index} className={`h-3 w-3 rounded-full ${dotClass}`} />
                          ))}
                        </div>
                      ) : game.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white">{game.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-snug">{game.desc}</div>
                    </div>
                    <div className="flex-shrink-0 rounded-lg bg-cyan-500/70 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-cyan-500">
                      {t.home.open} →
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Placeholder modalità non selezionata */}
        {!mode && (
          <div className="text-center text-slate-500 text-sm py-4">
            {t.home.chooseMode}
          </div>
        )}
      </div>
    </div>
  );
}

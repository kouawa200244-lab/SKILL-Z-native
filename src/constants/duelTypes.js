// src/constants/duelTypes.js

import { Swords, TrendingUp, Target, Shield, Award, Flag, Timer, Clock, Crown, User } from "lucide-react-native";

export const DUEL_TYPES = {
  face_a_face:        { label: "Face à Face (1v1)",        desc: "Match direct, le gagnant prend tout",                          icon: Swords,     category: "performance" },
  score_plus_eleve:   { label: "Score le plus élevé",       desc: "Jouer contre l'IA, meilleur score gagne",                      icon: TrendingUp, category: "performance" },
  ecart_points:       { label: "Écart de points (Handicap)",desc: "Joueur A doit gagner par l'écart défini",                       icon: Target,     category: "performance" },
  clean_sheet:        { label: "Clean Sheet",               desc: "Premier qui encaisse perd",                                     icon: Shield,     category: "performance" },
  precision_passes:   { label: "Précision des passes",      desc: "% de passes réussies le plus élevé",                            icon: Award,      category: "precision" },
  efficacite_tir:     { label: "Efficacité au tir",         desc: "Ratio tirs cadrés / buts",                                      icon: Target,     category: "precision" },
  discipline:         { label: "Discipline de fer",         desc: "Moins de fautes/cartons",                                       icon: Flag,       category: "precision" },
  maitrise_vehicule:  { label: "Maîtrise du véhicule",      desc: "Temps en vitesse max ou drift",                                 icon: Timer,      category: "precision", games: ["nfs"] },
  premier_a:          { label: "Le Premier à...",           desc: "Premier à poster la preuve",                                     icon: Clock,      category: "vitesse" },
  chrono_pur:         { label: "Chrono pur",                desc: "Performance la plus rapide",                                     icon: Timer,      category: "vitesse" },
  survie_chronometree:{ label: "Survie Chronométrée",       desc: "Tenir le plus longtemps sans échec",                             icon: Timer,      category: "vitesse" },
  petit_poucet:       { label: "Petit Poucet",              desc: "Gagner avec équipe 1-2★, meilleur score",                       icon: Crown,      category: "scenario" },
  comeback:           { label: "Comeback",                  desc: "Remonter un handicap de 2 buts",                                 icon: TrendingUp, category: "scenario" },
  no_star_player:     { label: "No Star Player",            desc: "Interdit d'utiliser le meilleur joueur",                        icon: User,       category: "scenario" },
};

export function getDuelCondition(type) {
  const duel = DUEL_TYPES[type];
  if (!duel) return 'Condition inconnue';
  return duel.desc || 'Condition du duel';
}

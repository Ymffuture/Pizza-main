// src/hooks/useTheme.js
import { useState, useEffect, useCallback } from "react";

// The only theme available on the FREE plan — every other theme is a
// ProBite perk. Referenced by SettingsPanel.jsx (gating the picker) and
// BillingContext.jsx (reverting a lapsed/non-ProBite account).
export const FREE_THEME_ID = "fire";

export const THEMES = [
  {
    id:    "fire",
    name:  "Fire",
    emoji: "🔥",
    vars: {
      "--red":    "#DA291C",
      "--red2":   "#b91c1c",
      "--gold":   "#FFC72C",
      "--dark":   "#0e0700",
      "--card":   "#1a0e00",
      "--border": "rgba(255,199,44,0.12)",
      "--text":   "#fff8e7",
      "--muted":  "rgba(255,248,231,0.42)",
      "--accent": "#FFC72C",
    },
    preview: ["#DA291C", "#FFC72C", "#1a0e00"],
  },
  {
    id:    "ocean",
    name:  "Ocean",
    emoji: "🌊",
    vars: {
      "--red":    "#0ea5e9",
      "--red2":   "#0284c7",
      "--gold":   "#06b6d4",
      "--dark":   "#020c1a",
      "--card":   "#051525",
      "--border": "rgba(6,182,212,0.15)",
      "--text":   "#e0f7ff",
      "--muted":  "rgba(224,247,255,0.42)",
      "--accent": "#06b6d4",
    },
    preview: ["#0ea5e9", "#06b6d4", "#051525"],
  },
  {
    id:    "forest",
    name:  "Forest",
    emoji: "🌿",
    vars: {
      "--red":    "#16a34a",
      "--red2":   "#15803d",
      "--gold":   "#86efac",
      "--dark":   "#030a05",
      "--card":   "#071a0b",
      "--border": "rgba(134,239,172,0.15)",
      "--text":   "#ecfdf5",
      "--muted":  "rgba(236,253,245,0.42)",
      "--accent": "#86efac",
    },
    preview: ["#16a34a", "#86efac", "#071a0b"],
  },
  {
    id:    "purple",
    name:  "Galaxy",
    emoji: "💜",
    vars: {
      "--red":    "#7c3aed",
      "--red2":   "#6d28d9",
      "--gold":   "#c084fc",
      "--dark":   "#07030f",
      "--card":   "#110825",
      "--border": "rgba(192,132,252,0.15)",
      "--text":   "#faf5ff",
      "--muted":  "rgba(250,245,255,0.42)",
      "--accent": "#c084fc",
    },
    preview: ["#7c3aed", "#c084fc", "#110825"],
  },
  {
    id:    "sunset",
    name:  "Sunset",
    emoji: "🌅",
    vars: {
      "--red":    "#f97316",
      "--red2":   "#ea6b0a",
      "--gold":   "#fbbf24",
      "--dark":   "#0f0700",
      "--card":   "#1e0f00",
      "--border": "rgba(251,191,36,0.15)",
      "--text":   "#fffbeb",
      "--muted":  "rgba(255,251,235,0.42)",
      "--accent": "#fbbf24",
    },
    preview: ["#f97316", "#fbbf24", "#1e0f00"],
  },
  {
    id:    "rose",
    name:  "Rose",
    emoji: "🌸",
    vars: {
      "--red":    "#e11d48",
      "--red2":   "#be123c",
      "--gold":   "#fb7185",
      "--dark":   "#0f0207",
      "--card":   "#1f0510",
      "--border": "rgba(251,113,133,0.15)",
      "--text":   "#fff1f2",
      "--muted":  "rgba(255,241,242,0.42)",
      "--accent": "#fb7185",
    },
    preview: ["#e11d48", "#fb7185", "#1f0510"],
  },
];

const STORAGE_KEY = "kb_theme";

export function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function useTheme() {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "fire";
  });

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const changeTheme = useCallback((id) => {
    const theme = THEMES.find(t => t.id === id);
    if (!theme) return;
    setThemeId(id);
    localStorage.setItem(STORAGE_KEY, id);
    applyTheme(theme);
  }, []);

  return { themeId, currentTheme, changeTheme, themes: THEMES };
}

export const categoricalPalette = [
  { slot: 1, name: "blue", light: "#2a78d6", dark: "#3987e5" },
  { slot: 2, name: "orange", light: "#eb6834", dark: "#d95926" },
  { slot: 3, name: "aqua", light: "#1baf7a", dark: "#199e70" },
  { slot: 4, name: "yellow", light: "#eda100", dark: "#c98500" },
  { slot: 5, name: "magenta", light: "#e87ba4", dark: "#d55181" },
  { slot: 6, name: "green", light: "#008300", dark: "#008300" },
  { slot: 7, name: "violet", light: "#4a3aa7", dark: "#9085e9" },
  { slot: 8, name: "red", light: "#e34948", dark: "#e66767" },
] as const;

export const status = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  warning: { light: "#fab219", dark: "#fab219" },
  serious: { light: "#ec835a", dark: "#ec835a" },
  critical: { light: "#d03b3b", dark: "#d03b3b" },
};

export const entradaColor = { light: "#0ca30c", dark: "#0ca30c" };
export const saidaColor = { light: "#d03b3b", dark: "#d03b3b" };

export function categoryColorLight(index: number) {
  return categoricalPalette[index % categoricalPalette.length].light;
}

export function categoryColorForTheme(lightHex: string, isDark: boolean) {
  if (!isDark) return lightHex;
  return (
    categoricalPalette.find((p) => p.light === lightHex)?.dark ?? lightHex
  );
}

export const chartChrome = {
  light: {
    text: "#52514e",
    muted: "#898781",
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    surface: "#fcfcfb",
  },
  dark: {
    text: "#c3c2b7",
    muted: "#898781",
    grid: "#2c2c2a",
    axis: "#383835",
    surface: "#1a1a19",
  },
};

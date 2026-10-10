import localFont from "next/font/local"

// Self-hosted so builds and dev never depend on reaching Google Fonts.
export const inter = localFont({
  src: "../app/fonts/inter-latin-variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
  adjustFontFallback: "Arial",
})

export const sourceSerif = localFont({
  src: "../app/fonts/source-serif-4-latin-opsz-variable.woff2",
  weight: "200 900",
  display: "swap",
  variable: "--font-source-serif",
  adjustFontFallback: "Times New Roman",
})

export const fontVariables = `${inter.variable} ${sourceSerif.variable}`

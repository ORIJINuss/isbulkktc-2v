import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const yapi: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./bilesenler/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Pearl Field - Dominant Environment (70-80%)
        "pearl": {
          "alan": "#FAF9F3",
          "sicak": "#FFFBF7",
          "ana": "#FEFDFB",
          "notr": "#F5F3ED",
          "soguk": "#F0EDE5"
        },
        // Bedford - Brand Anchor (5-10%)
        "bedford": {
          "gölge": "#1B3A35",
          "temel": "#234C44",
          "mineral": "#336B5F",
          "hafif": "#5FA29D",
          "uzerine": "#FFFFFF"
        },
        // Frozen Air - Optical Accents (1-3%)
        "buzlu": {
          "derin": "#4A7C8E",
          "hava": "#A8D4DD",
          "kenar": "#D0E6EC",
          "beyaz": "#F7FBFD"
        },
        // Mineral System - Neutral Ramp (10-18%)
        "mineral": {
          "50": "#F5F4F1",
          "100": "#E8E7E2",
          "200": "#D9D8D1",
          "300": "#C1BEB6",
          "400": "#A89F95",
          "500": "#8B8279"
        },
        // Optical Transition Colors
        "zeytin-inci": "#B8B89F",
        "verdigris": "#679899",
        "mineral-teal": "#7BB5A3",
        // Status Colors
        "basari": "#1E4B39",
        "basari-arka": "#E8F4EE",
        "uyari": "#8B5C0C",
        "uyari-arka": "#FDF6E7",
        "bilgi": "#1F4355",
        "bilgi-arka": "#EDF5FA",
        "hata": "#C74747",
        "hata-arka": "#FADADB",
        // Surface & Text
        "yüzey": "#FAF9F3",
        "yüzey-uzerinde": "#1B1C19",
        "cizgi": "#C1C8C5",
        "cizgi-degisken": "#E0E2DE",

        // ─────────────────────────────────────────────────────────────────
        // Legacy semantic layer — "Mineral Field System"
        //
        // Bu katman UYGULAMANIN GERİ KALAN KISMI tarafından kullanılır
        // (28 dosya). Stitch 2.0 ham paleti (pearl/bedford/buzlu/mineral)
        // semantik rollerin yerine geçmez; ikisi birbirinin yerine geçen
        // iki palet değil, ham token / semantik token katmanlarıdır.
        //
        // Kaynak: stitch_i_bulkktc_design_system_architect/mineral_field_system/DESIGN.md
        //        ve .stitch/DESIGN.md "Semantic Color Roles" tablosu.
        // ─────────────────────────────────────────────────────────────────

        // Yüzeyler (surface)
        "yüzey-parlak": "#FAFCFD",
        "yüzey-sonkuk": "#EEEEE7",
        "yüzey-kapsayici": "#E6E6DD",
        "yüzey-kapsayici-alt": "#F1F5F2",
        "yüzey-kapsayici-yüksek": "#DCDCD1",
        "yüzey-kapsayici-en-yüksek": "#CECEC1",
        "yüzey-degisken-uzerinde": "#414846",

        // Birincil eylem (primary)
        "ana": "#183A33",
        "ana-kapsayici": "#305149",
        "ana-outline": "#9FC2B8",
        "ana-sabit": "#619588",
        "ana-sabit-uzerinde": "#00201A",
        "ana-uzerinde": "#FFFFFF",

        // İkincil eylem (secondary)
        "ikincil": "#40655C",
        "ikincil-kapsayici": "#C0E8DD",
        "ikincil-sabit": "#7BB5A3",
        "ikincil-sabit-varyant-uzerinde": "#284D45",

        // Üçüncül eylem (tertiary)
        "tersiyer-sabit": "#B8B89F",
        "tersiyer-sabit-uzerinde": "#1B1C19",

        // Durum kapsayıcıları (semantic container + üzerindeki metin)
        "hata-kapsayici": "#FADADB",
        "hata-kapsayici-uzerinde": "#5A1E1E",

        // Metin rolleri (ink)
        "hüküm": "#1B1C19",
        "hüküm-ikincil": "#414846",
        "hüküm-sonuk": "#727976",

        // Altın / kurumsal vurgu (B3 rozetleri)
        "altin-cila": "#A1A990",
        "altin-sabit": "#EDEFE0",

        // Durum (status) — metin tonları
        "basari-900": "#1E4B39",
        "hata-900": "#5A1E1E",

        // Nötr
        "beyaz": "#FFFFFF"
      },
      borderRadius: {
        // NOT: Tailwind'in `sm` / `md` / `lg` / `full` ölçekleri bilerek
        // override EDİLMEDİ. Mineral Field System'e göre `md` = 0.375rem
        // (6px) olmalı; global ölçek değiştirmek tüm mevcut bileşenleri
        // kırar. Stitch radius ölçeği yalnızca isimli token'lar olarak
        // sunulur: aşağıdaki `kart` / `düğme-sm` / `düğme-lg`.
        "kart": "0.75rem",
        "dügme-sm": "0.5rem",
        "dügme-lg": "0.75rem"
      },
      spacing: {
        "bosluk-xs": "0.25rem",
        "bosluk-sm": "0.5rem",
        "bosluk-md": "1rem",
        "bosluk-lg": "1.5rem",
        "bosluk-xl": "2.5rem",
        "olcu": "1.5rem",
        "dis": "2rem"
      },
      fontFamily: {
        "sans": ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
        "baslik": ["var(--font-manrope)", "Manrope", "Satoshi", "system-ui", "sans-serif"],
        "teknik": ["var(--font-inter)", "Inter", "ui-monospace", "monospace"],
        "hebrew": ["var(--font-assistant)", "Assistant", "Hebrew", "sans-serif"],
        "haber": ["var(--yazi-govde)"],
        "sans-govde": ["var(--yazi-ibranice)"],
        "govde": ["var(--yazi-govde)"]
      },
      fontSize: {
        // Display & Hero
        "display-lg": ["3.5rem", { lineHeight: "1.2", fontWeight: "400", letterSpacing: "-0.02em" }],
        "display-sm": ["2.25rem", { lineHeight: "1.2", fontWeight: "400", letterSpacing: "-0.015em" }],
        // Headings
        "h1": ["2.5rem", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" }],
        "h2": ["1.875rem", { lineHeight: "1.3", fontWeight: "600" }],
        "h3": ["1.5rem", { lineHeight: "1.4", fontWeight: "600" }],
        // Body
        "body": ["1rem", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.4", fontWeight: "400" }],
        // Metadata
        "metadata": ["0.75rem", { lineHeight: "1.3", fontWeight: "500", letterSpacing: "0.04em" }],
        "metadata-sm": ["0.6875rem", { lineHeight: "1.3", fontWeight: "500", letterSpacing: "0.06em" }],
        // Legacy compatibility
        "govde-xs": ["0.6875rem", { lineHeight: "0.875rem", letterSpacing: "0.06em", fontWeight: "500" }],
        "govde-sm": ["0.8125rem", { lineHeight: "1.25rem", letterSpacing: "0.01em", fontWeight: "400" }],
        "govde-md": ["0.9375rem", { lineHeight: "1.5rem", letterSpacing: "0.005em", fontWeight: "400" }],
        "govde-lg": ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "0em", fontWeight: "400" }],
        "etiket-xs": ["0.625rem", { lineHeight: "0.75rem", letterSpacing: "0.08em", fontWeight: "500" }],
        "etiket-sm": ["0.6875rem", { lineHeight: "0.875rem", letterSpacing: "0.06em", fontWeight: "500" }],
        "etiket-md": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.04em", fontWeight: "600" }],
        "etiket-lg": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.02em", fontWeight: "600" }],
        "baslik-sm": ["1.125rem", { lineHeight: "1.5rem", letterSpacing: "0em", fontWeight: "600" }],
        "baslik-md": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em", fontWeight: "600" }],
        "baslik-lg": ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "-0.01em", fontWeight: "500" }],
        "gosteri-sm": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.015em", fontWeight: "400" }],
        "gosteri-lg": ["3.5rem", { lineHeight: "4rem", letterSpacing: "-0.02em", fontWeight: "400" }]
      },
      boxShadow: {
        // Stitch Material Levels
        "mineral": "0 1px 3px rgb(35 62 52 / 0.04), 0 2px 8px rgb(35 62 52 / 0.04)",
        "cam": "0 8px 24px rgba(35, 62, 52, 0.08)",
        "kristal": "0 12px 32px rgba(35, 62, 52, 0.12)",
        "kaplama": "0 24px 60px -12px rgb(35 62 52 / 0.25)",
        // Legacy compatibility
        "mineral-dosye": "0 1px 2px rgb(35 62 52 / 0.06), 0 4px 14px -4px rgb(35 62 52 / 0.08)",
        "mineral-yukseltilmis": "0 -1px 0 rgb(200 221 236 / 0.6), 0 8px 24px -4px rgb(35 62 52 / 0.12)",
        "editoriyel-kart": "0 1px 3px rgb(35 62 52 / 0.04), 0 2px 8px rgb(35 62 52 / 0.04)"
      },
      transitionDuration: {
        "micro": "160ms",
        "material": "500ms",
        "atmosferik": "3000ms"
      },
      animation: {
        "micro": "fade 160ms ease-out",
        "material": "slide 500ms ease-out",
        "atmosferik": "drift 6s ease-in-out infinite"
      },
      keyframes: {
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slide: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        drift: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
          "100%": { transform: "translateY(0px)" }
        }
      }
    }
  },
  plugins: [forms]
};

export default yapi;

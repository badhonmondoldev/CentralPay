/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#07090D',
        card: '#10141B',
        'card-border': '#1A212D',
        primary: {
          DEFAULT: '#55B510',
          hover: '#46990C',
        },
        accent: {
          DEFAULT: '#00D9FF',
          hover: '#00B8D9',
        },
        foreground: '#FFFFFF',
        muted: '#8B93A1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

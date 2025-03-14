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
        background: 'var(--bg-color)',
        foreground: 'var(--text-color)',
        accent: 'var(--accent-color)',
        'user-prefix': 'var(--user-prefix-color)',
        'ai-prefix': 'var(--ai-prefix-color)',
        system: 'var(--system-color)',
        error: 'var(--error-color)',
        'input-bg': 'var(--input-bg)',
        'code-bg': 'var(--code-bg)',
        border: 'var(--border-color)',
      },
      fontFamily: {
        mono: ['var(--font-inter)', 'monospace'],
      },
    },
  },
  plugins: [],
}; 
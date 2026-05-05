/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a3d62',
          light: '#1a5276'
        },
        saffron: {
          DEFAULT: '#e67e22',
          dark: '#d35400'
        },
        success: '#1e8449',
        warning: '#f39c12',
        danger: '#c0392b',
        background: '#f0f4f8',
        card: '#ffffff',
        border: '#dde3ea',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

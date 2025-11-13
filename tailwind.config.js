/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF6EA",
          100: "#FFEBD3",
          200: "#FFDEB4",
          300: "#FFD08E",
          400: "#FDA65D",
          500: "#F8903E",
          600: "#F77F00",
          700: "#CC6700",
          800: "#A65200",
          900: "#733800",
        },
      },
       boxShadow: {
        soft: "0 8px 24px rgba(253,166,93,.15)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
}

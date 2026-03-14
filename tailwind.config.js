/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Thêm prefix để tránh conflict với CSS của Admin (tùy chọn)
  // prefix: 'tw-',
  
  // Hoặc chỉ apply Tailwind cho Player components
  corePlugins: {
    preflight: true, // Reset CSS mặc định của Tailwind
  }
}

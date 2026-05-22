import type { Config } from "tailwindcss";

const config: Config = {
  // 💡 핵심: class 전략을 사용하여 next-themes와 연동
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // 만약 ui 폴더가 분리되어 있다면 아래처럼 추가할 수도 있습니다.
    // "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 색상, 폰트 등 커스텀 테마 설정
    },
  },
  plugins: [],
};
export default config;

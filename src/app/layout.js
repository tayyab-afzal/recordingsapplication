import "./globals.css";
import Providers from "./providers";
import { Montserrat, Poppins } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "Stealth Connect - Dashboard",
  description: "Stealth Connect",
};

const themeScript = `
(function() {
  function getInitialTheme() {
    try {
      const stored = localStorage.getItem("theme");
      if (stored && (stored === "light" || stored === "dark")) return stored;
    } catch (e) {}
    // Default to light if nothing stored or invalid value
    return "light";
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }

  const theme = getInitialTheme();
  applyTheme(theme);
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${poppins.variable}`}
    >
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

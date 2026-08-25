import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// One family for both display and body — weight does the differentiating
// (headings already carry font-semibold/font-bold throughout the app).
// A single confident, rounded sans reads more cohesive and premium than a
// second display face, matching the reference's chunky rounded headings.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chore Wars",
  description: "Fair chores and bills for shared houses.",
};

// Runs before hydration so an explicit saved theme applies immediately —
// without this, the page would flash the OS-preference theme first, then
// snap to the saved one once React mounts. Static string, no user input,
// safe as an inline script.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

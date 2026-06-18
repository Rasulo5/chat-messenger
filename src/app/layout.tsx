import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Chat",
  description: "Простой чат без регистрации",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen relative overflow-x-hidden">
        {/* Декоративные фоновые элементы */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-glow"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-glow"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-glow"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>
        {children}
      </body>
    </html>
  );
}

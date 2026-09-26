import "./globals.css";

export const metadata = {
  title: "Shortly",
  description: "A URL shortener with click analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
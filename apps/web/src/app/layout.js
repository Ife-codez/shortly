import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Shortly",
  description: "A URL shortener with click analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
import "./globals.css";
import { Public_Sans } from "next/font/google";
import { ActiveLink } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Jarvis</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta name="description" content="Jarvis AI life coach" />
        <meta property="og:title" content="Jarvis coach" />
        <meta property="og:description" content="Jarvis AI life coach" />
      </head>
      <body className={publicSans.className}>
        <div className="bg-secondary grid grid-rows-[auto,1fr] h-[100dvh]">
          <div className="grid grid-cols-[1fr,auto] gap-2 p-4">
            <div className="flex gap-4 flex-col md:flex-row md:items-center">
              <nav className="flex gap-1 flex-col md:flex-row">
                <ActiveLink href="/">Jarvis</ActiveLink>
              </nav>
            </div>
          </div>
          <div className="bg-background mx-4 relative grid rounded-t-2xl border border-input border-b-0">
            <div className="absolute inset-0">{children}</div>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

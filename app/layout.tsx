import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.com"), // replace with your domain

  title: {
    default: "Tic Tac Toe Online Game",
    template: "%s | Tic Tac Toe Game",
  },

  description:
    "Play Tic Tac Toe online for free. Challenge a friend or test your skills against the computer in this fast, modern, and interactive game.",

  keywords: [
    "tic tac toe",
    "tic tac toe online",
    "play tic tac toe",
    "xo game",
    "browser games",
    "free online games",
  ],

  authors: [{ name: "Mac Pherson" }],

  creator: "Mac Pherson",

  openGraph: {
    title: "Tic Tac Toe Online Game",
    description:
      "Enjoy a fast and modern Tic Tac Toe game. Play against friends or AI directly in your browser.",
    url: "https://your-domain.com",
    siteName: "Tic Tac Toe Game",
    images: [
      {
        url: "/og-image.png", // create this image in /public
        width: 1200,
        height: 630,
        alt: "Tic Tac Toe Game Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Tic Tac Toe Online Game",
    description:
      "Play Tic Tac Toe online for free. Clean UI, smooth gameplay, and fun challenges.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-white">
        {children}
      </body>
    </html>
  );
}
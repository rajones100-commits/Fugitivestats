import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });
export const metadata: Metadata = { title:"Fugitives Statistics Centre", description:"Combined career records for Newport Fugitives Cricket Club's 1st, 2nd and 3rd XIs.", other:{"codex-preview":"development"} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body className={`${display.variable} ${body.variable}`}>{children}</body></html>}

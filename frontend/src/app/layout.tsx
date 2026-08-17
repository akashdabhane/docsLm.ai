import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocsLM.ai — AI Document Knowledge Platform",
  description: "DocsLM is a production-quality, document-only AI knowledge platform inspired by NotebookLM. The application allows users to create notebook workspaces, upload multi-format documents (PDF, DOCX, TXT, MD), execute structure-aware document parsing & vector indexing, query documents using a LangGraph-orchestrated RAG workflow with page-level citations, jump directly to cited source sections in a side-by-side document viewer, and generate studio outputs including Mind Maps, Presentation Slide Decks, Interactive Quizzes, 3D Study Flashcards, and AI Audio Podcast Overviews.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <Analytics />

    </html>
  );
}

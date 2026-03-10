import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrainDrop — AI Training Videos for Small Business",
  description:
    "Turn your phone videos and notes into polished training SOPs your team will actually watch and complete.",
  keywords: ["training", "SOP", "small business", "AI", "video"],
  openGraph: {
    title: "TrainDrop",
    description: "AI-powered training videos for small business",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

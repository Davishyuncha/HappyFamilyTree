import type { Metadata } from "next";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";

export const metadata: Metadata = {
  title: "연안 차씨 디지털 가승",
  description: "우리 가문의 이야기를, 누구나 쉽게 읽고 함께 채워가는 살아있는 가승",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <GlobalNav />
        {children}
      </body>
    </html>
  );
}

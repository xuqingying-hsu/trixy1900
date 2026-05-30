import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "阿彩的宇宙传讯站",
  description: "阿彩的每日宇宙传讯、大众占卜与选题采集站。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
title: "TenderHub",
description: "Smarter Procurement. Stronger Uganda.",
};

export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
return ( <html lang="en"><body><AuthSessionProvider>{children}</AuthSessionProvider></body></html>
);
}

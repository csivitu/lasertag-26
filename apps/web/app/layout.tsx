import type { Metadata } from "next";
import "./globals.css";
import { anton, arcade, oxanium, pressStart } from "./fonts";

export const metadata: Metadata = {
    title: "LaserTag",
    description: "From Pixels to Pew Pew",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={`${arcade.variable} ${pressStart.variable} ${oxanium.variable} ${anton.variable}`}
        >
            <body style={{ margin: 0, minHeight: "100vh", display: "flex", flexDirection: "column", background: "#08080d", color: "white" }}>
                {children}
            </body>
        </html>
    );
}
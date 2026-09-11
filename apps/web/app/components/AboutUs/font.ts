import { Press_Start_2P, Oxanium, Anton } from "next/font/google";

export const pixelFont = Press_Start_2P({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-pixel",
    display: "swap",
});

export const oxaniumFont = Oxanium({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    variable: "--font-oxanium",
    display: "swap",
});

export const antonFont = Anton({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-anton",
    display: "swap",
});

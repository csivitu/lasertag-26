import { Press_Start_2P, Oxanium, Anton } from "next/font/google";
// NOTE: "arcade" maps to Press_Start_2P (the pixel/arcade font)
// If you have a separate local Arcade font, swap the import here.

export const arcade = Press_Start_2P({
    subsets: ["latin"],
    weight: "400",
    variable: "--ft-logo",
    display: "swap",
});

export const pressStart = Press_Start_2P({
    subsets: ["latin"],
    weight: "400",
    variable: "--ft-pixel",
    display: "swap",
});

export const oxanium = Oxanium({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    variable: "--ft-body",
    display: "swap",
});

export const anton = Anton({
    subsets: ["latin"],
    weight: "400",
    variable: "--ft-heading",
    display: "swap",
});

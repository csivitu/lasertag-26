"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AboutSection.module.css";
import AboutUsHeader from "./AboutUsHeader";
import AboutUsLeftDisc from "./AboutUsLeftDisc";
import AboutUsVid from "./AboutUsVid";
import ArcadeAccessories from "./Arcadeaccessories";
import Pacman from "./pacman";

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 900;

export default function AboutUs() {
    const stageRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;

        function updateScale() {
            const el2 = stageRef.current;
            if (!el2) return;
            const width = el2.clientWidth;
            const height = el2.clientHeight;
            const nextScale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
            setScale(nextScale > 0 ? nextScale : 1);
        }

        updateScale();
        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(el);
        window.addEventListener("resize", updateScale);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateScale);
        };
    }, []);

    return (
        <section className={styles.section} ref={stageRef}>
            <Pacman />
            <div
                className={styles.stageFrame}
                style={{
                    width: DESIGN_WIDTH * scale,
                    height: DESIGN_HEIGHT * scale,
                }}
            >
                <div
                    className={styles.canvas}
                    style={{
                        transform: `scale(${scale})`,
                    }}
                >
                    <AboutUsHeader />
                    <AboutUsLeftDisc />
                    <AboutUsVid />
                    <ArcadeAccessories />
                </div>
            </div>
        </section>
    );
}
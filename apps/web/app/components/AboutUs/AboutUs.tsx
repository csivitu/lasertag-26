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
        <section id="about" className={styles.section} ref={stageRef}>
            {/* Desktop View (>= 1024px): 1440x900 proportional canvas fitting 100vh with static arcade row at bottom */}
            <div className="hidden lg:contents">
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
                        <div className={styles.pacmanHint}>
                            <p>
                                <span className={styles.pacmanHintKey}>←</span> to move pacman
                            </p>
                            <p>
                                reach the end &amp; hunt ghosts{" "}
                                <span className={styles.pacmanHintKey}>→</span>
                            </p>
                        </div>
                        <AboutUsVid />
                        <ArcadeAccessories />
                        <Pacman />
                    </div>
                </div>
            </div>

            {/* Mobile View (< 1024px): Fluid responsive column with playable arcade runway */}
            <div className={styles.mobileContainer}>
                <AboutUsHeader />
                <div className={styles.contentGrid}>
                    <AboutUsLeftDisc />
                    <div className={styles.pacmanHint}>
                        <p>
                            tap pacman to start
                        </p>
                    </div>
                    <div className={styles.mediaWrap}>
                        <AboutUsVid />
                        <ArcadeAccessories />
                    </div>
                </div>
                <Pacman isMobile />
            </div>
        </section>
    );
}
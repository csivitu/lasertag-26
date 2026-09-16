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
    const [isDesktop, setIsDesktop] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(min-width: 1024px)").matches
    );

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;

        let lastScale = 0;
        function updateScale() {
            const el2 = stageRef.current;
            if (!el2) return;
            const width = el2.clientWidth;
            const height = el2.clientHeight;
            const nextScale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
            // Round + skip no-op updates — RO fires continuously during
            // scroll-snap tweens, and each setState was a full re-render.
            const rounded = Math.round(nextScale * 1000) / 1000;
            if (rounded > 0 && Math.abs(rounded - lastScale) > 0.001) {
                lastScale = rounded;
                setScale(rounded);
            }
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
            {/* Desktop View (>= 1024px): single-mounted, mobile tree not in DOM. */}
            {isDesktop ? (
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
            ) : (
                /* Mobile View (< 1024px): desktop canvas not in DOM — halves
                   video/Pacman/image instances decoded. */
                <div className={styles.mobileContainer}>
                    <AboutUsHeader />
                    <div className={styles.contentGrid}>
                        <AboutUsLeftDisc />
                        <div className={styles.pacmanHint}>
                            <p>
                                tap pacman to play
                            </p>
                        </div>
                        <div className={styles.mediaWrap}>
                            <AboutUsVid />
                            <ArcadeAccessories />
                        </div>
                    </div>
                    <Pacman isMobile />
                </div>
            )}
        </section>
    );
}
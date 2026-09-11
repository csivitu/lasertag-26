import Image from "next/image";
import { dots, sparkles, VIEWBOX_H, VIEWBOX_W } from "./starfield.data";
import styles from "./AboutSection.module.css";

const SPARK_SRC: Record<string, string> = {
    a: "/about/sparkle-burst.svg",
    b: "/about/sparkle-dot.svg",
    c: "/about/sparkle-ring.svg",
};

export function PinkStars() {
    return (
        <div
            style={{
                pointerEvents: "none",
                position: "absolute",
                inset: 0,
                zIndex: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {sparkles.map(([x, y, w, h, shape], i) => (
                <div
                    key={`pink-spark-${i}`}
                    style={{
                        position: "absolute",
                        left: `${(x / VIEWBOX_W) * 100}%`,
                        top: `${(y / VIEWBOX_H) * 100}%`,
                        width: `${(w / VIEWBOX_W) * 100}%`,
                        height: `${(h / VIEWBOX_H) * 100}%`,
                    }}
                >
                    <Image src={SPARK_SRC[shape] || SPARK_SRC.a} alt="" fill unoptimized />
                </div>
            ))}
        </div>
    );
}

export function Starfield() {
    return (
        <div className={styles.starfield}>
            {/* SVG Pixel Dots */}
            <svg
                aria-hidden
                viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
                preserveAspectRatio="xMidYMid slice"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            >
                <g>
                    {dots.map(([x, y, s, c], i) => (
                        <rect
                            key={`star-dot-${i}`}
                            x={x}
                            y={y}
                            width={s}
                            height={s}
                            fill={c}
                        />
                    ))}
                </g>
            </svg>
            {/* Sparkles Layer */}
            <PinkStars />
        </div>
    );
}

export default Starfield;
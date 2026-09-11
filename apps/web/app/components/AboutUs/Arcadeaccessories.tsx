"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import styles from "./AboutSection.module.css";

const JOYSTICK_SRC = "/about/joystick.png";
const CASSETTE_SRC = "/about/cassette-bar.png";
const WIRE_SRC = "/about/wire.png";

export default function ArcadeAccessories() {
    const joystickRef = useRef<HTMLDivElement>(null);
    const [joystickTilt, setJoystickTilt] = useState({ rotateZ: 0, rotateX: 0 });

    function handleJoystickMove(e: React.MouseEvent<HTMLDivElement>) {
        const el = joystickRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height * 0.35;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        const clampedDx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
        const clampedDy = Math.max(-1, Math.min(1, dy / (rect.height / 2)));

        setJoystickTilt({
            rotateZ: clampedDx * 12,
            rotateX: -clampedDy * 8,
        });
    }

    function handleJoystickLeave() {
        setJoystickTilt({ rotateZ: 0, rotateX: 0 });
    }

    return (
        <>
            <div className={styles.cassetteWrap}>
                <Image src={CASSETTE_SRC} alt="" fill className={styles.fitImg} />
            </div>

            <div className={styles.wireWrap}>
                <Image src={WIRE_SRC} alt="" fill className={styles.fitImg} unoptimized />
            </div>

            <div
                ref={joystickRef}
                className={styles.joystickWrap}
                onMouseMove={handleJoystickMove}
                onMouseLeave={handleJoystickLeave}
            >
                <div
                    className={styles.joystickTiltInner}
                    style={{
                        transform: `perspective(600px) rotateX(${joystickTilt.rotateX}deg) rotateZ(${joystickTilt.rotateZ}deg)`,
                        transformOrigin: "50% 88%",
                    }}
                >
                    <Image src={JOYSTICK_SRC} alt="" fill className={styles.fitImg} />
                </div>
            </div>
        </>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./AboutSection.module.css";

const PACMAN_SRC = "/about/pacman.png";
const GHOST_SRCS = [
    "/about/ghost-1.png",
    "/about/ghost-2.png",
    "/about/ghost-3.png",
    "/about/ghost-4.png",
];
const JOYSTICK_SRC = "/about/joystick.png";
const CASSETTE_SRC = "/about/cassette-bar.png";
const WIRE_SRC = "/about/wire.png";

const PERIMETER_PATH_D =
    "M 105 25 L 1335 25 A 50 50 0 0 1 1385 75 L 1385 795 A 50 50 0 0 1 1335 845 L 105 845 A 50 50 0 0 1 55 795 L 55 75 A 50 50 0 0 1 105 25 Z";

const ANIMATION_DURATION_MS = 16000;
const GHOST_STAGGER_PX = 65;
const DOT_SPACING_PX = 55;
const DOT_COUNT = 4;

const PACMAN_SIZE = 64;
const GHOST_SIZE = 80;

interface Point {
    x: number;
    y: number;
    angle: number;
}

interface DotSlot {
    id: number;
    distance: number;
}

interface RenderedDot {
    id: number;
    x: number;
    y: number;
}

export default function Pacman() {
    const joystickRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);

    const [joystickTilt, setJoystickTilt] = useState({ rotateZ: 0, rotateX: 0 });

    const [pacmanPos, setPacmanPos] = useState<Point>({ x: 105, y: 25, angle: 0 });
    const [ghostPositions, setGhostPositions] = useState<Point[]>([
        { x: 105, y: 25, angle: 0 },
        { x: 105, y: 25, angle: 0 },
        { x: 105, y: 25, angle: 0 },
        { x: 105, y: 25, angle: 0 },
    ]);
    const [renderedDots, setRenderedDots] = useState<RenderedDot[]>([]);

    const dotsRef = useRef<DotSlot[]>([]);
    const nextDotIdRef = useRef(0);
    const dotsInitializedRef = useRef(false);

    useEffect(() => {
        if (dotsInitializedRef.current) return;
        const slots: DotSlot[] = [];
        for (let i = 1; i <= DOT_COUNT; i++) {
            slots.push({ id: nextDotIdRef.current++, distance: i * DOT_SPACING_PX });
        }
        dotsRef.current = slots;
        dotsInitializedRef.current = true;
    }, []);

    useEffect(() => {
        let animationFrameId: number;
        let startTime: number | null = null;

        function animate(timestamp: number) {
            if (!startTime) startTime = timestamp;
            const path = pathRef.current;
            if (!path) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }

            const totalLength = path.getTotalLength();
            if (totalLength === 0) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }

            const elapsed = timestamp - startTime;
            const rawDistance = (elapsed / ANIMATION_DURATION_MS) * totalLength;
            const loopedDistance = rawDistance % totalLength;

            const ptPacman = path.getPointAtLength(loopedDistance);
            const ptNext = path.getPointAtLength((loopedDistance + 3) % totalLength);
            const anglePacman = Math.atan2(ptNext.y - ptPacman.y, ptNext.x - ptPacman.x) * (180 / Math.PI);

            setPacmanPos({
                x: (ptPacman.x / 1440) * 100,
                y: (ptPacman.y / 900) * 100,
                angle: anglePacman,
            });

            const newGhostPositions: Point[] = [];
            for (let i = 0; i < 4; i++) {
                const ghostDist = (loopedDistance - GHOST_STAGGER_PX * (i + 1) + totalLength) % totalLength;
                const ptGhost = path.getPointAtLength(ghostDist);
                const ptGhostNext = path.getPointAtLength((ghostDist + 3) % totalLength);
                const angleGhost = Math.atan2(ptGhostNext.y - ptGhost.y, ptGhostNext.x - ptGhost.x) * (180 / Math.PI);

                newGhostPositions.push({
                    x: (ptGhost.x / 1440) * 100,
                    y: (ptGhost.y / 900) * 100,
                    angle: angleGhost,
                });
            }
            setGhostPositions(newGhostPositions);

            const slots = dotsRef.current;
            while (slots.length > 0 && rawDistance >= slots[0].distance) {
                slots.shift();
                const lastDistance = slots.length > 0 ? slots[slots.length - 1].distance : rawDistance;
                slots.push({ id: nextDotIdRef.current++, distance: lastDistance + DOT_SPACING_PX });
            }

            const newRenderedDots: RenderedDot[] = slots.map((slot) => {
                const loopedSlotDistance = slot.distance % totalLength;
                const pt = path.getPointAtLength(loopedSlotDistance);
                return {
                    id: slot.id,
                    x: (pt.x / 1440) * 100,
                    y: (pt.y / 900) * 100,
                };
            });
            setRenderedDots(newRenderedDots);

            animationFrameId = requestAnimationFrame(animate);
        }

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

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
            <svg
                viewBox="0 0 1440 900"
                className={styles.arcadePathSvg}
                preserveAspectRatio="none"
            >
                <path
                    ref={pathRef}
                    d={PERIMETER_PATH_D}
                    fill="none"
                    stroke="none"
                />
            </svg>

            <div className={styles.dotsContainer}>
                {renderedDots.map((dot) => (
                    <span
                        key={dot.id}
                        className={styles.arcadeDot}
                        style={{
                            left: `${dot.x}%`,
                            top: `${dot.y}%`,
                        }}
                    />
                ))}
            </div>

            <div
                className={styles.pacmanItem}
                style={{
                    left: `${pacmanPos.x}%`,
                    top: `${pacmanPos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${pacmanPos.angle - 180}deg)`,
                }}
            >
                <Image
                    src={PACMAN_SRC}
                    alt="Pacman"
                    width={PACMAN_SIZE}
                    height={PACMAN_SIZE}
                    className={styles.fitImg}
                />
            </div>

            {ghostPositions.map((ghostPos, index) => (
                <div
                    key={index}
                    className={styles.ghostItem}
                    style={{
                        left: `${ghostPos.x}%`,
                        top: `${ghostPos.y}%`,
                        transform: `translate(-50%, -50%) rotate(${ghostPos.angle - 180}deg)`,
                    }}
                >
                    <Image
                        src={GHOST_SRCS[index]}
                        alt={`Ghost ${index + 1}`}
                        width={GHOST_SIZE}
                        height={GHOST_SIZE}
                        className={styles.fitImg}
                    />
                </div>
            ))}

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
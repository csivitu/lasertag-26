"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./AboutSection.module.css";

const VIDEO_SRC = "/videos/laser-tag.webm";
const FRAME_PINK_SRC = "/about/frame-pink.png";

export default function AboutUsVid() {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        // Lazy-play: only fetch + decode + play while in view.
        // Pause preserves currentTime, so no state is lost.
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(video);
        return () => observer.disconnect();
    }, []);

    return (
        <div className={styles.photoBox}>
            <div className={styles.photoInner}>
                <video
                    ref={videoRef}
                    src={VIDEO_SRC}
                    className={styles.photoImg}
                    preload="metadata"
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                />
            </div>
            <Image
                src={FRAME_PINK_SRC}
                alt=""
                fill
                className={styles.frameImg}
                unoptimized
            />
        </div>
    );
}

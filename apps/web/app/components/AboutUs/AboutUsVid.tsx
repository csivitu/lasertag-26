import Image from "next/image";
import styles from "./AboutSection.module.css";

const VIDEO_SRC = "/videos/laser-tag.webm";
const FRAME_PINK_SRC = "/about/frame-pink.png";

export default function AboutUsVid() {
    return (
        <div className={styles.photoBox}>
            <div className={styles.photoInner}>
                <video
                    src={VIDEO_SRC}
                    className={styles.photoImg}
                    autoPlay
                    loop
                    muted
                    playsInline
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

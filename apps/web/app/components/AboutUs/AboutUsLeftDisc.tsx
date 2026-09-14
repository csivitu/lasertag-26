import Image from "next/image";
import styles from "./AboutSection.module.css";

const FRAME_PINK_SRC = "/about/frame-pink.png";
const ICON_VEST_SRC = "/about/vest.svg";
const ICON_GUN_SRC = "/about/gun.svg";
const ICON_TARGET_SRC = "/about/Target.svg";

export default function AboutUsLeftDisc() {
    return (
        <div className={styles.infoBox}>
            <Image
                src={FRAME_PINK_SRC}
                alt=""
                fill
                className={styles.frameImg}
                unoptimized
            />
            <p
                className={`${styles.infoIntro} text-[clamp(12px,2.4vw,20px)] leading-[1.35] tracking-[0.04em] lg:text-[24px]`}
            >
                Laser Tag offers you a chance to step on to the arena for a
                thrilling multi-player experience.
            </p>
            <ul className={styles.infoList}>
                <li>
                    <span className={styles.infoIcon}>
                        <Image src={ICON_VEST_SRC} alt="" fill className={styles.fitImg} aria-hidden="true" unoptimized />
                    </span>
                    <span>Don your vests</span>
                </li>
                <li>
                    <span className={styles.infoIcon}>
                        <Image src={ICON_GUN_SRC} alt="" fill className={styles.fitImg} aria-hidden="true" unoptimized />
                    </span>
                    <span>Have your guns at the ready</span>
                </li>
                <li>
                    <span className={styles.infoIcon}>
                        <Image src={ICON_TARGET_SRC} alt="" fill className={styles.fitImg} aria-hidden="true" unoptimized />
                    </span>
                    <div>
                        <span>Maximise hits to climb up the</span>{" "}
                        <a href="#leaderboard" className={styles.link}>leaderboard</a>
                    </div>
                </li>
            </ul>
        </div>
    );
}
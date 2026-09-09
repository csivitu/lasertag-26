import Image from "next/image";
import styles from "./AboutSection.module.css";

const FRAME_PINK_SRC = "/about/frame-pink.png";
const ICON_VEST_SRC = "/about/icon-vest.png";
const ICON_GUN_SRC = "/about/icon-gun.png";
const ICON_TARGET_SRC = "/about/icon-target.png";

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
            <p className={styles.infoIntro}>
                Laser Tag offers you a chance to step on to
                <br />
                the arena for a thrilling multi-player
                <br />
                experience.
            </p>
            <ul className={styles.infoList}>
                <li>
                    <Image src={ICON_VEST_SRC} alt="" width={55} height={55} aria-hidden="true" unoptimized />
                    <span>Don your vests</span>
                </li>
                <li>
                    <Image src={ICON_GUN_SRC} alt="" width={60} height={55} aria-hidden="true" unoptimized />
                    <span>Have your guns at the ready</span>
                </li>
                <li>
                    <Image src={ICON_TARGET_SRC} alt="" width={65} height={65} aria-hidden="true" unoptimized />
                    <div>
                        <span>Maximise hits to climb up the</span>
                        <br />
                        <a href="#leaderboard" className={styles.link}>leaderboard</a>
                    </div>
                </li>
            </ul>
        </div>
    );
}
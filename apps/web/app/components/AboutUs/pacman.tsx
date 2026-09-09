import Image from "next/image";
import styles from "./AboutSection.module.css";

const PACMAN_SRC = "/about/pacman.png";
const GHOSTS_SRC = "/about/ghosts.png";
const JOYSTICK_SRC = "/about/joystick.png";
const CASSETTE_SRC = "/about/cassette-bar.png";
const WIRE_SRC = "/about/wire.png";

export default function Pacman() {
    return (
        <>
            {/* Cassette Bar */}
            <div className={styles.cassetteWrap}>
                <Image src={CASSETTE_SRC} alt="" fill className={styles.fitImg} />
            </div>

            {/* Wire image connecting Cassette Bar right side to Joystick neck */}
            <div className={styles.wireWrap}>
                <Image src={WIRE_SRC} alt="" fill className={styles.fitImg} unoptimized />
            </div>

            {/* Joystick positioned so wire enters its right side */}
            <div className={styles.joystickWrap}>
                <Image src={JOYSTICK_SRC} alt="" fill className={styles.fitImg} />
            </div>

            {/* Yellow dots row on the left */}
            <div className={styles.dotsWrap}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
            </div>

            {/* Pacman facing left */}
            <div className={styles.pacmanWrap}>
                <Image src={PACMAN_SRC} alt="Pacman" fill className={styles.fitImg} />
            </div>

            {/* Upright Ghosts facing left */}
            <div className={styles.ghostsWrap}>
                <Image src={GHOSTS_SRC} alt="Ghosts" fill className={styles.fitImg} />
            </div>
        </>
    );
}

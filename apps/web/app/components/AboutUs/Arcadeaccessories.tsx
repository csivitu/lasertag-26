import Image from "next/image";
import styles from "./AboutSection.module.css";

const JOYSTICK_SRC = "/about/joystick.png";
const CASSETTE_SRC = "/about/cassette-bar.png";
const WIRE_SRC = "/about/wire.png";

export default function ArcadeAccessories() {
    return (
        <>
            <div className={styles.cassetteWrap}>
                <Image src={CASSETTE_SRC} alt="" fill className={styles.fitImg} />
            </div>

            <div className={styles.wireWrap}>
                <Image src={WIRE_SRC} alt="" fill className={styles.fitImg} unoptimized />
            </div>

            <div className={styles.joystickWrap}>
                <Image src={JOYSTICK_SRC} alt="" fill className={styles.fitImg} />
            </div>
        </>
    );
}

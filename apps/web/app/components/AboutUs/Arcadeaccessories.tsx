import Image from "next/image";
import styles from "./AboutSection.module.css";

const CASSETTE_SRC = "/about/cassette-bar.png";

export default function ArcadeAccessories() {
    return (
        <div className={styles.cassetteWrap}>
            <Image src={CASSETTE_SRC} alt="" fill className={styles.fitImg} />
        </div>
    );
}

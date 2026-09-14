import Image from "next/image";
import styles from "./AboutSection.module.css";

const CASSETTE_SRC = "/about/cassette-bar.png";

export default function ArcadeAccessories() {
    return (
        <div className={`${styles.cassetteWrap} select-none`}>
            <Image src={CASSETTE_SRC} alt="" fill draggable={false} className={`${styles.fitImg} select-none`} />
        </div>
    );
}

import Image from "next/image";
import styles from "./AboutSection.module.css";

const PHOTO_SRC = "/about/photo.jpg";
const FRAME_PINK_SRC = "/about/frame-pink.png";

export default function AboutUsVid() {
    return (
        <div className={styles.photoBox}>
            <div className={styles.photoInner}>
                <Image
                    src={PHOTO_SRC}
                    alt="Players setting up the laser tag arena"
                    fill
                    className={styles.photoImg}
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

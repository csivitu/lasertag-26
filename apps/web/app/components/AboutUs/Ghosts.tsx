import Image from "next/image";
import styles from "./AboutSection.module.css";

const GHOSTS = [
    { src: "/about/ghost-1.png", alt: "Blinky" },
    { src: "/about/ghost-2.png", alt: "Inky" },
    { src: "/about/ghost-3.png", alt: "Pinky" },
    { src: "/about/ghost-4.png", alt: "Clyde" },
];

export default function Ghosts() {
    return (
        <div className={`${styles.ghostsRow} select-none`}>
            {GHOSTS.map((ghost, index) => (
                <div key={index} className={styles.ghostItem}>
                    <Image
                        src={ghost.src}
                        alt={ghost.alt}
                        fill
                        draggable={false}
                        className={`${styles.fitImg} select-none`}
                        priority
                    />
                </div>
            ))}
        </div>
    );
}

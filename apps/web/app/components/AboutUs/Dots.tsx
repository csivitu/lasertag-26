import styles from "./AboutSection.module.css";

const DOT_COUNT = 8;

export default function Dots() {
    return (
        <div className={`${styles.dotsWrap} select-none`}>
            {Array.from({ length: DOT_COUNT }).map((_, i) => (
                <span key={i} className={styles.dot} />
            ))}
        </div>
    );
}

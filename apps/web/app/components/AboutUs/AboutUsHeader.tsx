import styles from "./AboutSection.module.css";

export default function AboutUsHeader() {
    return (
        <div className={styles.headingWrap}>
            <h2 className={styles.heading}>
                <span>A Thrilling <span className={styles.headingAccent}>Multiplayer</span></span>
                <br />
                <span>Shooting Experience</span>
            </h2>
            <span className={`${styles.bracket} ${styles.bracketTL}`} />
            <span className={`${styles.bracket} ${styles.bracketTR}`} />
            <span className={`${styles.bracket} ${styles.bracketBL}`} />
            <span className={`${styles.bracket} ${styles.bracketBR}`} />
        </div>
    );
}

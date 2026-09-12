import styles from "./AboutSection.module.css";
import AboutUsHeader from "./AboutUsHeader";
import AboutUsLeftDisc from "./AboutUsLeftDisc";
import AboutUsVid from "./AboutUsVid";
import ArcadeAccessories from "./Arcadeaccessories";
import Pacman from "./pacman";

export default function AboutUs() {
    return (
        <section id="about" className={styles.section}>
            <Pacman />
            <div className={styles.container}>
                <AboutUsHeader />
                <div className={styles.contentGrid}>
                    <AboutUsLeftDisc />
                    <div className={styles.mediaWrap}>
                        <AboutUsVid />
                        <ArcadeAccessories />
                    </div>
                </div>
            </div>
        </section>
    );
}
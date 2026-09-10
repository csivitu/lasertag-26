import Image from "next/image";
import styles from "./AboutSection.module.css";
import AboutUsHeader from "./AboutUsHeader";
import AboutUsLeftDisc from "./AboutUsLeftDisc";
import AboutUsVid from "./AboutUsVid";
import Pacman from "./pacman";
import { Starfield } from "./Starfield";


export default function AboutUs() {
    return (
        <section className={styles.section}>
            <div className={styles.canvas}>
                {/* SVG Starfield with Pixel Sparkles and Dots */}
                <Starfield />


                {/* Sub-components */}
                <AboutUsHeader />
                <AboutUsLeftDisc />
                <AboutUsVid />
                <Pacman />
            </div>
        </section>
    );
}
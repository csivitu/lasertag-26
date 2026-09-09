
import Footer from "../components/Footer";
import SvgUpperLeft from "../components/SvgUpperLeft";
import TextUpperRight from "../components/TextUpperRight";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-black text-white">
      <section className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-6 px-4 pt-6 pb-2 sm:gap-8 sm:px-8 sm:pt-10 sm:pb-4 lg:grid-cols-2">
        <div className="order-2 flex w-full items-center justify-center lg:order-1">
          <SvgUpperLeft />
        </div>

        <div className="order-1 flex w-full items-center justify-center lg:order-2">
          <TextUpperRight />
        </div>
      </section>
 
      <Footer />
    </main>
  );
}
 

































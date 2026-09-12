"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const MAX_ENERGY = 5;

export function SponsEnergy() {
  const [energy, setEnergy] = useState(1);
  const increasing = useRef(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((current) => {
        if (current === MAX_ENERGY) {
          increasing.current = false;
          return current - 1;
        }

        if (current === 1) {
          increasing.current = true;
          return current + 1;
        }

        return increasing.current ? current + 1 : current - 1;
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center">
      <div className="relative size-[clamp(28px,4.1vw,59px)] shrink-0">
        <Image
          src="/spons/energy.svg"
          alt=""
          fill
          sizes="(min-width: 1024px) 4.1vw, 4.1vw"
          className="object-contain"
        />
      </div>

      <div className="ml-[clamp(4px,0.55vw,8px)] flex items-center">
        {Array.from({ length: MAX_ENERGY }).map((_, index) => (
          <Image
            key={index}
            src={
              index < energy
                ? "/spons/energy-filled.svg"
                : "/spons/energy-empty.svg"
            }
            alt=""
            width={44}
            height={32}
            className={`h-auto w-[clamp(20px,3.02vw,44px)] shrink-0 ${
              index > 0 ? "-ml-[0.42vw]" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
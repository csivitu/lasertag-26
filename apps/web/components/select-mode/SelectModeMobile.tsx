"use client";

import type { PopupMode } from "../mode-popup/ModePopup";
import { Starfield } from "../hero/Starfield";

interface SelectModeMobileProps {
  onSelect: (mode: PopupMode) => void;
}

export function SelectModeMobile({ onSelect }: SelectModeMobileProps) {
  return (
    <section
      className="relative block min-h-[100svh] overflow-hidden bg-[#08080d] lg:hidden font-pixel"
    >
      {/* Background Decor */}
      <Starfield />

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col items-center justify-start p-6 pt-20 pb-12 gap-10">
        
        {/* Title */}
        <div className="w-[300px] max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/select-mode/SELECT YOUR MODE.svg" 
            alt="SELECT YOUR MODE" 
            className="w-full h-auto"
          />
        </div>

        {/* Selection Column */}
        <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md">
          
          {/* SOLO PANEL */}
          <div className="relative flex flex-col items-center w-full max-w-[340px] aspect-square p-8 group">
            {/* Box Background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/select-mode-solo/solo-box.svg" 
              alt="" 
              className="absolute inset-0 w-full h-full object-fill transition-transform duration-300 active:scale-95"
            />
            
            {/* Corner Dashes */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/select-mode-solo/solo-topdash.svg" 
              alt="" 
              className="absolute top-8 right-3 w-[40px] h-auto z-20"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/select-mode-solo/solo-bottomdash.svg" 
              alt="" 
              className="absolute bottom-8 left-3 w-[40px] h-auto z-20"
            />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center flex-1 w-full">
              {/* Avatar */}
              <div className="h-28 flex items-end justify-center mb-3 transition-transform duration-300 group-hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/select-mode/select-mode-solo/solo-avatar.svg" 
                  alt="Solo Player" 
                  className="h-full w-auto"
                />
              </div>

              {/* SOLO text */}
              <div className="h-10 flex items-center justify-center">
                <div className="w-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/select-mode/select-mode-solo/solo.svg" 
                    alt="SOLO" 
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* 1 Player */}
              <div className="h-8 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/select-mode/select-mode-solo/icon.svg" alt="" className="h-5 w-auto" />
                  <span className="text-[#f5d506] text-sm uppercase tracking-widest"></span>
                </div>
              </div>

              {/* Join Button */}
              <button
                type="button"
                aria-label="Join as solo player"
                onClick={() => onSelect("solo")}
                className="mt-auto cursor-pointer border-0 bg-transparent p-0 pt-4 transition-transform duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#23eff1]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/select-mode/select-mode-solo/join-solo.svg" 
                  alt="Join Solo" 
                  className="w-40 h-auto mx-auto"
                />
              </button>
            </div>
          </div>

          {/* OR Divider */}
          <div className="w-16 shrink-0 my-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/OR.svg" 
              alt="OR" 
              className="w-full h-auto mx-auto"
            />
          </div>

          {/* TEAM PANEL */}
          <div className="relative flex flex-col items-center w-full max-w-[340px] aspect-square p-8 group">
            {/* Box Background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/select-mode-team/team-box.svg" 
              alt="" 
              className="absolute inset-0 w-full h-full object-fill transition-transform duration-300 active:scale-95"
            />

            {/* Corner Dashes */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/select-mode-team/team-topdash.svg" 
              alt="" 
              className="absolute top-8 right-3 w-[40px] h-auto z-20"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/select-mode-team/team-bottomdash.svg" 
              alt="" 
              className="absolute bottom-8 left-3 w-[40px] h-auto z-20"
            />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center flex-1 w-full">
              {/* Team Avatars */}
              <div className="h-28 flex items-end justify-center gap-0 mb-3 transition-transform duration-300 group-hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/select-mode/select-mode-team/blue-guy.svg" alt="" className="h-[75%] w-auto -mr-2" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/select-mode/select-mode-team/purple-guy.svg" alt="" className="h-[85%] w-auto z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/select-mode/select-mode-team/yellow-guy.svg" alt="" className="h-[85%] w-auto z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/select-mode/select-mode-team/pink-guy.svg" alt="" className="h-[75%] w-auto -ml-2" />
              </div>

              {/* TEAM text */}
              <div className="h-10 flex items-center justify-center">
                <div className="w-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/select-mode/select-mode-team/team.svg" 
                    alt="TEAM" 
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* 5 Players */}
              <div className="h-8 flex items-center justify-center">
                <div className="w-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/select-mode/select-mode-team/no-of-players.svg" alt="5 Players" className="w-full h-auto" />
                </div>
              </div>

              {/* Create/Join Team Buttons */}
              <div className="relative mt-auto pt-4 transition-transform duration-200 w-full max-w-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/select-mode/select-mode-team/create-join-team.svg" 
                  alt="Create or Join Team" 
                  className="w-full h-auto"
                />
                <button
                  type="button"
                  aria-label="Create a team"
                  onClick={() => onSelect("create_team")}
                  className="absolute bottom-0 left-0 top-4 w-[48%] cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#23eff1]"
                />
                <button
                  type="button"
                  aria-label="Join a team"
                  onClick={() => onSelect("join_team")}
                  className="absolute bottom-0 right-0 top-4 w-[48%] cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#23eff1]"
                />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

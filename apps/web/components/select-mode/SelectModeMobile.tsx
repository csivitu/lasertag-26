"use client";

import React from "react";
import { Starfield } from "../hero/Starfield";
import { HeroHeader } from "../hero/HeroHeader";
import { PlayerCountLabel } from "./PlayerCountLabel";
import type { PopupMode } from "../mode-popup/ModePopup";

interface SelectModeMobileProps {
  onSelect: (mode: PopupMode) => void;
  currentModeNote?: string | null;
}

export function SelectModeMobile({ onSelect, currentModeNote }: SelectModeMobileProps) {
  return (
    <section
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#08080d] lg:hidden font-pixel pb-10 select-none"
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Background Decor */}
      <Starfield />

      {/* Top Retro Navigation Header */}
      <HeroHeader />

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-[clamp(1.5rem,6vw,3rem)] px-[clamp(1rem,5vw,2rem)] py-8">
        
        {/* Title */}
        <div className="w-[300px] max-w-full mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/select-mode/SELECT YOUR MODE.svg" 
            alt="SELECT YOUR MODE" 
            className="w-full h-auto"
          />
        </div>
        {currentModeNote && (
          <p className="-mt-3 font-pixel text-[10px] tracking-[0.2em] text-white/50">
            {currentModeNote}
          </p>
        )}

        {/* Selection Column */}
        <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md">
          
          {/* SOLO PANEL */}
          <div className="relative flex flex-col items-center w-full max-w-[clamp(300px,84vw,380px)] aspect-square p-8 group cursor-pointer">
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
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
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
                <PlayerCountLabel text="1 PLAYER" size="sm" />
              </div>

              {/* Join Button */}
              <button
                type="button"
                aria-label="Join as solo player"
                onClick={() => onSelect("solo")}
                className="relative w-36 mt-2 cursor-pointer border-0 bg-transparent p-0 transition-transform duration-200 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#23eff1]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/select-mode/select-mode-solo/join-solo.svg" 
                  alt="Join Solo" 
                  className="w-full h-auto"
                />
                <span
                  aria-hidden
                  className="btn-select-solo-shine pointer-events-none absolute inset-0 overflow-hidden"
                >
                  <span className="button-shine block h-full w-1/3" />
                </span>
              </button>
            </div>
          </div>

          {/* OR Divider */}
          <div className="w-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/OR.svg" 
              alt="OR" 
              className="w-full h-auto"
            />
          </div>

          {/* TEAM PANEL */}
          <div className="relative flex flex-col items-center w-full max-w-[clamp(300px,84vw,380px)] aspect-square p-8 group cursor-pointer">
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
              className="absolute top-6 right-4 w-[40px] h-auto z-20"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/select-mode/select-mode-team/team-bottomdash.svg" 
              alt="" 
              className="absolute bottom-6 left-4 w-[40px] h-auto z-20"
            />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
              {/* Team Avatars */}
              <div className="flex flex-row items-end justify-center gap-0 h-24 mb-3 transition-transform duration-300 group-hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/select-mode/select-mode-team/blue-guy.svg" alt="" className="h-[85%] w-auto -mr-4" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/select-mode/select-mode-team/yellow-guy.svg" alt="" className="h-[85%] w-auto z-10 -translate-y-2" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/select-mode/select-mode-team/pink-guy.svg" alt="" className="h-[85%] w-auto -ml-4" />
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

              {/* MAX 5 PLAYERS — same shared label as solo/desktop */}
              <div className="h-8 flex items-center justify-center">
                <PlayerCountLabel text="MAX 5 PLAYERS" size="sm" />
              </div>

              {/* Create/Join Team Buttons */}
              <div className="relative w-[300px] max-w-full mt-2 transition-transform duration-200 active:scale-95">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/select-mode/select-mode-team/create-join-team.svg" 
                  alt="Create or Join Team" 
                  className="w-full h-auto"
                />
                <span
                  aria-hidden
                  className="btn-select-team-shine pointer-events-none absolute inset-0 overflow-hidden"
                >
                  <span className="button-shine block h-full w-1/3" />
                </span>
                <button
                  type="button"
                  aria-label="Create a team"
                  onClick={() => onSelect("create_team")}
                  className="absolute left-0 top-0 h-full w-[48%] cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#23eff1]"
                />
                <button
                  type="button"
                  aria-label="Join a team"
                  onClick={() => onSelect("join_team")}
                  className="absolute right-0 top-0 h-full w-[48%] cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#23eff1]"
                />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client"; 
 
import React from "react";
import { Starfield } from "../hero/Starfield"; 
import { HeroHeader } from "../hero/HeroHeader";
import { PlayerCountLabel } from "./PlayerCountLabel";
import type { PopupMode } from "../mode-popup/ModePopup";

interface SelectModeDesktopProps {
  onSelect: (mode: PopupMode) => void;
  currentModeNote?: string | null;
}

export function SelectModeDesktop({ onSelect, currentModeNote }: SelectModeDesktopProps) { 
  return ( 
    <section 
      className="relative hidden min-h-[100svh] overflow-hidden bg-[#08080d] lg:flex lg:flex-col justify-between font-pixel pt-[2vh] pb-8 select-none"
      onDragStart={(e) => e.preventDefault()}
    > 
      {/* Background Decor */}
      <Starfield /> 

      {/* Top Retro Navigation Header */}
      <HeroHeader />
 
      {/* Main Content Layout */} 
      <div className="relative z-10 my-auto flex flex-col items-center justify-center p-8"> 
         
        {/* Title */} 
        <div className="mb-10 w-[600px] max-w-full"> 
          <img  
            src="/select-mode/SELECT YOUR MODE.svg"  
            alt="SELECT YOUR MODE"  
            className="w-full h-auto" 
          /> 
        </div> 
        {currentModeNote && (
          <p className="-mt-6 mb-6 font-pixel text-[10px] tracking-[0.2em] text-white/50">
            {currentModeNote}
          </p>
        )}
 
        {/* Selection Row */}
        <div className="flex flex-row items-center justify-center gap-6 w-full max-w-6xl xl:gap-12"> 
           
          {/* SOLO PANEL */} 
          <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center w-full max-w-[450px] aspect-square p-8 xl:p-12 group cursor-pointer"> 
            {/* Box Background */} 
            <img  
              src="/select-mode/select-mode-solo/solo-box.svg"  
              alt=""  
              className="absolute inset-0 w-full h-full object-fill transition-transform duration-300 group-hover:scale-[1.02]" 
            /> 
             
            {/* Corner Dashes */} 
            <img  
              src="/select-mode/select-mode-solo/solo-topdash.svg"  
              alt=""  
              className="absolute top-10 right-5 w-[52px] h-auto z-20" 
            /> 
            <img  
              src="/select-mode/select-mode-solo/solo-bottomdash.svg"  
              alt=""  
              className="absolute bottom-10 left-5 w-[52px] h-auto z-20" 
            /> 
 
            {/* Content Container */} 
            <div className="relative z-10 flex flex-col items-center gap-6 mt-4"> 
              {/* Avatar */} 
              <div className="h-40 mb-2 transition-transform duration-300 group-hover:-translate-y-2"> 
                <img  
                  src="/select-mode/select-mode-solo/solo-avatar.svg"  
                  alt="Solo Player"  
                  className="h-full w-auto" 
                /> 
              </div> 
 
              {/* SOLO text */} 
              <div className="w-48"> 
                <img  
                  src="/select-mode/select-mode-solo/solo.svg"  
                  alt="SOLO"  
                  className="w-full h-auto" 
                /> 
              </div> 
 
              {/* 1 Player */}
              <PlayerCountLabel text="1 PLAYER" />
 
              {/* Join Button */} 
              <button
                type="button"
                aria-label="Join as solo player"
                onClick={() => onSelect("solo")}
                className="relative w-48 mt-2 cursor-pointer border-0 bg-transparent p-0 transition-transform duration-200 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#23eff1]"
              > 
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
          <div className="w-24 shrink-0 mx-4"> 
            <img  
              src="/select-mode/OR.svg"  
              alt="OR"  
              className="w-full h-auto" 
            /> 
          </div> 
 
          {/* TEAM PANEL */} 
          <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center w-full max-w-[450px] aspect-square p-8 xl:p-12 group cursor-pointer"> 
            {/* Box Background */} 
            <img  
              src="/select-mode/select-mode-team/team-box.svg"  
              alt=""  
              className="absolute inset-0 w-full h-full object-fill transition-transform duration-300 group-hover:scale-[1.02]" 
            /> 
 
            {/* Corner Dashes */} 
            <img  
              src="/select-mode/select-mode-team/team-topdash.svg"  
              alt=""  
              className="absolute top-7 right-6 w-[52px] h-auto z-20" 
            /> 
            <img  
              src="/select-mode/select-mode-team/team-bottomdash.svg"  
              alt=""  
              className="absolute bottom-7 left-6 w-[52px] h-auto z-20" 
            /> 
 
            {/* Content Container */} 
            <div className="relative z-10 flex flex-col items-center gap-6 mt-4"> 
              {/* Team Avatars */}
              <div className="flex flex-row items-end justify-center gap-0 h-40 mb-2 transition-transform duration-300 group-hover:-translate-y-2"> 
                <img src="/select-mode/select-mode-team/blue-guy.svg" alt="" className="h-[85%] w-auto -mr-7" /> 
                <img src="/select-mode/select-mode-team/yellow-guy.svg" alt="" className="h-[85%] w-auto z-10 -translate-y-4" /> 
                <img src="/select-mode/select-mode-team/pink-guy.svg" alt="" className="h-[85%] w-auto -ml-7" /> 
              </div> 
 
              {/* TEAM text */} 
              <div className="w-48"> 
                <img  
                  src="/select-mode/select-mode-team/team.svg"  
                  alt="TEAM"  
                  className="w-full h-auto" 
                /> 
              </div> 
 
              {/* MAX 5 PLAYERS */}
              <PlayerCountLabel text="MAX 5 PLAYERS" />

              {/* Create/Join Team Buttons */}
              <div className="relative w-[400px] max-w-full mt-2 transition-transform duration-200 active:scale-95"> 
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

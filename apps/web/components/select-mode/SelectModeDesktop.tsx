/* eslint-disable @next/next/no-img-element */
"use client"; 
 
import React from "react";
import { Starfield } from "../hero/Starfield"; 
 
export function SelectModeDesktop() { 
  return ( 
    <section 
      className="relative hidden h-[100svh] min-h-[640px] overflow-hidden bg-[#08080d] lg:block font-pixel" 
    > 
      {/* Background Decor */}
      <Starfield /> 
 
      {/* Main Content Layout */} 
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pt-16"> 
         
        {/* Title */} 
        <div className="mb-16 w-[600px] max-w-full"> 
          <img  
            src="/select-mode/SELECT YOUR MODE.svg"  
            alt="SELECT YOUR MODE"  
            className="w-full h-auto" 
          /> 
        </div> 
 
        {/* Selection Row */} 
        <div className="flex flex-row items-center justify-center gap-12 w-full max-w-6xl"> 
           
          {/* SOLO PANEL */} 
          <div className="relative flex flex-col items-center justify-center w-[450px] aspect-square p-12 group cursor-pointer"> 
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
              <div className="flex items-center gap-3 mt-1"> 
                <img src="/select-mode/select-mode-solo/icon.svg" alt="" className="h-8 w-auto" /> 
                <span className="text-[#f5d506] text-xl uppercase tracking-widest"></span> 
              </div> 
 
              {/* Join Button */} 
              <div className="relative w-48 mt-2 transition-transform duration-200 active:scale-95"> 
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
              </div> 
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
          <div className="relative flex flex-col items-center justify-center w-[450px] aspect-square p-12 group cursor-pointer"> 
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
              <div className="flex flex-row items-end justify-center gap-0 h-32 mb-4 transition-transform duration-300 group-hover:-translate-y-2"> 
                <img src="/select-mode/select-mode-team/blue-guy.svg" alt="" className="h-[90%] w-auto -mr-3" /> 
                <img src="/select-mode/select-mode-team/purple-guy.svg" alt="" className="h-[90%] w-auto z-10" /> 
                <img src="/select-mode/select-mode-team/yellow-guy.svg" alt="" className="h-[90%] w-auto z-10" /> 
                <img src="/select-mode/select-mode-team/pink-guy.svg" alt="" className="h-[90%] w-auto -ml-1" /> 
              </div> 
 
              {/* TEAM text */} 
              <div className="w-48"> 
                <img  
                  src="/select-mode/select-mode-team/team.svg"  
                  alt="TEAM"  
                  className="w-full h-auto" 
                /> 
              </div> 
 
              {/* 5 Players */} 
              <div className="mt-1 w-40"> 
                <img src="/select-mode/select-mode-team/no-of-players.svg" alt="5 Players" className="w-full h-auto" /> 
              </div> 
 
              {/* Create/Join Team Buttons */} 
              <div className="relative w-[400px] max-w-full mt-4 transition-transform duration-200 active:scale-95"> 
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
              </div> 
            </div> 
          </div> 
           
        </div> 
      </div> 
    </section> 
  ); 
} 

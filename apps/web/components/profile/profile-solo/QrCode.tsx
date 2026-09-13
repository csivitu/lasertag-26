export function QrCode({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width="29" height="29" fill="white" />
      {/* Outer Corners */}
      {/* Top Left Marker */}
      <rect x="2" y="2" width="7" height="7" fill="black" />
      <rect x="3" y="3" width="5" height="5" fill="white" />
      <rect x="4" y="4" width="3" height="3" fill="black" />

      {/* Top Right Marker */}
      <rect x="20" y="2" width="7" height="7" fill="black" />
      <rect x="21" y="3" width="5" height="5" fill="white" />
      <rect x="22" y="4" width="3" height="3" fill="black" />

      {/* Bottom Left Marker */}
      <rect x="2" y="20" width="7" height="7" fill="black" />
      <rect x="3" y="21" width="5" height="5" fill="white" />
      <rect x="4" y="22" width="3" height="3" fill="black" />

      {/* Timing Patterns */}
      <rect x="10" y="4" width="1" height="1" fill="black" />
      <rect x="12" y="4" width="1" height="1" fill="black" />
      <rect x="14" y="4" width="1" height="1" fill="black" />
      <rect x="16" y="4" width="1" height="1" fill="black" />

      <rect x="4" y="10" width="1" height="1" fill="black" />
      <rect x="4" y="12" width="1" height="1" fill="black" />
      <rect x="4" y="14" width="1" height="1" fill="black" />
      <rect x="4" y="16" width="1" height="1" fill="black" />

      {/* Inner Data Pixels */}
      <rect x="10" y="2" width="2" height="1" fill="black" />
      <rect x="14" y="2" width="1" height="2" fill="black" />
      <rect x="17" y="2" width="2" height="1" fill="black" />
      
      <rect x="10" y="6" width="3" height="1" fill="black" />
      <rect x="15" y="6" width="2" height="2" fill="black" />
      <rect x="18" y="5" width="1" height="2" fill="black" />

      <rect x="2" y="10" width="1" height="3" fill="black" />
      <rect x="7" y="10" width="2" height="1" fill="black" />
      <rect x="10" y="9" width="2" height="2" fill="black" />
      <rect x="13" y="10" width="2" height="1" fill="black" />
      <rect x="16" y="9" width="3" height="2" fill="black" />
      <rect x="21" y="10" width="2" height="1" fill="black" />
      <rect x="25" y="10" width="2" height="2" fill="black" />

      <rect x="6" y="13" width="2" height="1" fill="black" />
      <rect x="9" y="12" width="3" height="2" fill="black" />
      <rect x="14" y="13" width="1" height="3" fill="black" />
      <rect x="17" y="12" width="2" height="2" fill="black" />
      <rect x="20" y="13" width="3" height="1" fill="black" />
      <rect x="24" y="13" width="2" height="2" fill="black" />

      <rect x="2" y="15" width="2" height="2" fill="black" />
      <rect x="6" y="15" width="1" height="3" fill="black" />
      <rect x="8" y="16" width="3" height="1" fill="black" />
      <rect x="12" y="15" width="1" height="3" fill="black" />
      <rect x="16" y="15" width="2" height="1" fill="black" />
      <rect x="19" y="16" width="2" height="2" fill="black" />
      <rect x="23" y="16" width="3" height="1" fill="black" />

      <rect x="10" y="19" width="2" height="2" fill="black" />
      <rect x="13" y="19" width="3" height="1" fill="black" />
      <rect x="17" y="19" width="1" height="2" fill="black" />
      <rect x="20" y="19" width="3" height="2" fill="black" />
      <rect x="25" y="19" width="2" height="1" fill="black" />

      <rect x="10" y="22" width="1" height="3" fill="black" />
      <rect x="12" y="23" width="3" height="1" fill="black" />
      <rect x="16" y="22" width="2" height="2" fill="black" />
      <rect x="19" y="23" width="2" height="2" fill="black" />
      <rect x="23" y="22" width="1" height="3" fill="black" />
      <rect x="25" y="23" width="2" height="2" fill="black" />

      <rect x="10" y="26" width="3" height="1" fill="black" />
      <rect x="14" y="25" width="2" height="2" fill="black" />
      <rect x="17" y="26" width="3" height="1" fill="black" />
      <rect x="22" y="26" width="2" height="1" fill="black" />
      <rect x="25" y="26" width="2" height="1" fill="black" />
    </svg>
  );
}

import Image from "next/image";

const members = [
  { badge: "/profile/profile-team1/Group 756.svg", num: "01" },
  { badge: "/profile/profile-team1/Group 756 (1).svg", num: "02" },
  { badge: "/profile/profile-team1/Group 756 (2).svg", num: "03" },
  { badge: "/profile/profile-team1/Group 756 (3).svg", num: "04" },
  { badge: "/profile/profile-team1/Group 756 (4).svg", num: "05" },

];

export function TeamMembersSection() {
  return (
    <div className="flex flex-col justify-between h-full py-3 sm:py-5 px-3 sm:px-5">
      {/* Header Wordmark: TEAM MEMBERS */}
      <div className="mb-2 sm:mb-3">
        <div className="relative w-48 sm:w-60 aspect-[326/25]">
          <Image
            src="/profile/profile-team1/TEAM MEMBERS.svg"
            alt="TEAM MEMBERS"
            fill
            className="object-contain object-left"
          />
        </div>
      </div>

     {/* 5 Team Member Rows */}
<div className="flex flex-col justify-between flex-1">
  {members.map((m) => (
    <div
      key={m.num}
      className="flex items-center gap-2 sm:gap-3"
    >
      {/* Number badge */}
      <div className="relative w-9 h-7 sm:w-20 sm:h-9 shrink-0">
        <Image
          src={m.badge}
          alt={m.num}
          fill
          className="object-contain"
        />
      </div>

      {/* Member name */}
      <div className="relative h-9 sm:h-10 w-50 sm:w-50">
        <Image
          src="/profile/profile-team1/Group 757.svg"
          alt="Rishan Sharma - 25BAI0763"
          fill
          className="object-contain object-left"
        />
      </div>
    </div>
  ))}
</div>
    </div>
  );
}

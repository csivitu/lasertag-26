const links = [
  { label: "HOME", href: "#", active: false },
  { label: "ABOUT", href: "#about", active: true },
  { label: "FAQs", href: "#faqs", active: false },
  { label: "SIGN IN", href: "#sign-in", active: false },
];

export function Nav() {
  return (
    <nav className="hidden items-center gap-10 font-pixel text-sm tracking-[2px] text-white md:flex">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className={
            link.active
              ? "flex items-center gap-2 text-[#01daec]"
              : "hover:text-[#01daec]"
          }
        >
          {link.active && (
            <span
              className="h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-[#ffc410]"
              aria-hidden
            />
          )}
          {link.label}
        </a>
      ))}
    </nav>
  );
}

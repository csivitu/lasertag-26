 


import {
	FaGithub,
	FaInstagram,
	FaLinkedin,
	FaXTwitter,
} from "react-icons/fa6";
 
const iconClass =
	"p-2 border border-neutral-800 rounded bg-neutral-900/50 text-neutral-400 transition-all hover:border-[var(--icon-accent)] hover:text-[var(--icon-accent)]";
 
export default function IconsLowerRight() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end sm:gap-4">
			<a
				href="https://www.instagram.com/csivitu/?hl=en"
				target="_blank"
				rel="noreferrer"
				className={iconClass}
				style={{ "--icon-accent": "var(--pink)" } as React.CSSProperties}
			>
				<FaInstagram size={22} />
			</a>
			<a
				href="https://x.com/csivitu"
				target="_blank"
				rel="noreferrer"
				className={iconClass}
				style={{ "--icon-accent": "var(--cyan)" } as React.CSSProperties}
			>
				<FaXTwitter size={22} />
			</a>
			<a
				href="https://github.com/csivitu"
				target="_blank"
				rel="noreferrer"
				className={iconClass}
				style={{ "--icon-accent": "#ffffff" } as React.CSSProperties}
			>
				<FaGithub size={22} />
			</a>
			<a
				href="https://in.linkedin.com/company/csivitu"
				target="_blank"
				rel="noreferrer"
				className={iconClass}
				style={{ "--icon-accent": "var(--purple)" } as React.CSSProperties}
			>
				<FaLinkedin size={22} />
			</a>
		</div>
	);
}
 

































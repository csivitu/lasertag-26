# LaserTag Admin Dashboard Design Specification (`apps/admin/DESIGN.md`)

## Design Read
Reading this as: Modern Linear / Raycast-inspired Dark Mode theme for LaserTag Admin Dashboard (`apps/admin`), featuring deep dark slate background (`#09090B`), subtle dark surface containers (`#141417`), rounded 16-20px container cards with border-t highlight overlays, pill-style nav items & sub-tabs, vibrant pill badges for status tags, sleek typography, and polished micro-animations.

## Design Tokens

```yaml
colors:
  bg_root: "#09090B"         # Deep Obsidian Dark Main Background
  bg_surface: "#141417"      # Dark Surface Cards & Workstation Containers
  bg_surface_hover: "#1C1C21" # Hover Surface
  bg_elevated: "#23232A"     # Input fields / Badges background
  border_subtle: "#27272A"   # Subtle divider lines
  border_highlight: "#3F3F46"# Focused / Highlighted borders
  text_primary: "#FAFAFA"    # Primary Crisp White Text
  text_secondary: "#A1A1AA"  # Muted Gray Body Text
  text_muted: "#71717A"      # Dim Labels
  accent_primary: "#10B981"  # Mint Emerald Accent
  accent_rose: "#EF4444"     # Rose / High Priority Accent
  accent_amber: "#F59E0B"    # Amber / Warning Accent
  accent_indigo: "#8B5CF6"   # Purple / Todo Accent
  accent_blue: "#3B82F6"     # Cyan / Blue Accent

typography:
  font_sans: "Inter, system-ui, -apple-system, sans-serif"
  font_mono: "JetBrains Mono, monospace"

radii:
  card: "1rem"         # 16px rounded-2xl
  button: "0.75rem"    # 12px rounded-xl
  pill: "9999px"       # Full rounded pills for status tags
```

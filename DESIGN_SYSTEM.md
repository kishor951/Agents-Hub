# 🎨 DESIGN SYSTEM v1.0

A clean, modern, dark-theme system for an AI + Web3 dashboard.

---

## 1. BRAND & LOOK

**Overall Style:**
- Futuristic, minimal, high-contrast
- Dark surfaces with glowing accents
- Rounded corners, smooth shadows, no neon effects

**Design Keywords:**
- Intelligent • Confident • Precise • Modular • Web3-grade

---

## 2. COLOR SYSTEM

### 2.1 Core Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Primary/Blue | `#3A7BFF` | Primary buttons, active states, links |
| Secondary/Violet | `#7B4DFF` | Secondary actions, highlights, fusion accents |
| Accent/Teal | `#20E3B2` | Success states, confirmation, agent DNA/fusion visuals |
| Danger/Red | `#FF5252` | Errors |
| Warning/Yellow | `#F4D03F` | Warnings / soft alerts |

### 2.2 Surfaces & Background

| Token | Hex | Usage |
|-------|-----|-------|
| Background/Base | `#0A0F1F` | Main app background |
| Surface/Card | `#161A2B` | Cards, containers, panels |
| Surface/Alt | `#2C3345` | Inputs, dropdowns, secondary containers |

### 2.3 Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Text/Primary | `#F5F7FA` | Main text |
| Text/Secondary | `#AAB1C1` | Labels, descriptions |
| Text/Disabled | `#6B7280` | Disabled states |

### 2.4 Borders & Shadows

| Token | Value |
|-------|-------|
| Border color | `#2C3345` |
| Border radius | `12px` default |
| Card shadow | `0px 4px 16px rgba(0, 0, 0, 0.35)` |

---

## 3. TYPOGRAPHY

### 3.1 Font Families

- **Primary UI Font:** Space Grotesk (or System Sans as fallback)
- **Secondary Content Font:** IBM Plex Sans

### 3.2 Font Weights

- Light: 300
- Regular: 400
- Medium: 500
- Semi-bold: 600
- Bold: 700

### 3.3 Type Scale

| Element | Size | Weight |
|---------|------|--------|
| H1 | 32px | 700 |
| H2 | 24px | 600 |
| H3 | 20px | 600 |
| Subtitle | 18px | 500 |
| Body | 16px | 400 |
| Caption | 14px | 400 |
| Label | 12px | 500 |

---

## 4. SPACING SYSTEM

Use an 8-point modular spacing scale.

| Token | Value |
|-------|-------|
| XS | 4px |
| S | 8px |
| M | 16px |
| L | 24px |
| XL | 32px |
| XXL | 48px |

**Rules:**
- Card padding: 24px
- Section spacing: 48px
- Input vertical spacing: 12px
- Grid columns: 12-column, 24px gutters

---

## 5. COMPONENTS

### 5.1 Buttons

#### Primary Button
```
Background: #3A7BFF
Text: white
Radius: 12px
Padding: 14px 20px
Hover: lighten 8%
Disabled: opacity 0.4
```

#### Secondary Button
```
Background: #161A2B
Border: 1px solid #3A7BFF
Text: #3A7BFF
Radius: 12px
Padding: 14px 20px
```

#### Danger Button
```
Background: #FF5252
Text: white
Radius: 12px
Padding: 14px 20px
```

### 5.2 Input Fields
```
Height: 48px
Background: #2C3345
Border-radius: 12px
Padding: 0 16px
Focus border: #3A7BFF 2px solid
Placeholder text: #6B7280
```

### 5.3 Cards (Agent Cards)
```
Width: 100%
Padding: 24px
Background: #161A2B
Border-radius: 16px
Shadow: 0px 4px 16px rgba(0, 0, 0, 0.35)

Interior Elements:
- Agent name (H3)
- Skills badges
- Owner address (Caption)
- Generation (Label)
- "View" / "Breed" CTA buttons
```

### 5.4 Skill Badges
```
Background: rgba(58, 123, 255, 0.14)
Text: #3A7BFF
Font-size: 14px
Font-weight: 500
Padding: 6px 12px
Border-radius: 8px
```

### 5.5 Modal Windows (Fusion Modal)
```
Background: #161A2B
Border-radius: 20px
Padding: 32px
Overlay: rgba(0, 0, 0, 0.5)
Close icon: top-right (X button)

Interior Layout:
- Title (H2)
- Parent A Card
- Fusion Icon/Arrow
- Parent B Card
- Predicted Traits Preview
- Primary CTA: "Fuse Agents"
- Secondary CTA: "Cancel"
```

### 5.6 Navigation Bar / Header
```
Height: 64px
Background: #0A0F1F
Layout: Logo (left) | Nav Links (center) | Wallet Connect (right)
Font: 16px, 500
Active link color: #3A7BFF
Active link indicator: bottom border glow
```

---

## 6. LAYOUT SYSTEM

### Dashboard Layout
```
├─ Header (fixed, 64px)
├─ Main Content Area
│  ├─ Section Title (32px margin-bottom)
│  ├─ Agent Grid (3 columns on desktop, 2 on tablet, 1 on mobile)
│  └─ Cards spaced with 24px gutter
└─ Footer (optional)
```

### Grid Use
- **Desktop (>1024px):** 3-column cards
- **Tablet (768px-1024px):** 2-column cards
- **Mobile (<768px):** 1-column cards

---

## 7. INTERACTION RULES

- ✅ All actionable elements must have `hover` + `focus` states
- ✅ Animations must be subtle, <150ms duration (use Framer Motion or CSS transitions)
- ✅ Fusion flow must feel "alive" — slight glowing transitions, smooth opacity changes
- ✅ Wallet connect button must always be visible in header
- ✅ Loading state: shimmer skeleton or progress indicator (no spinning wheel)
- ✅ Success feedback: brief toast notification + confetti (optional)
- ✅ Error feedback: clear error message in red, persistent until dismissed

---

## 8. ICONOGRAPHY

**Icon Set:** Lucide Icons (open source, modern line icons)

**Specifications:**
- Stroke width: 1.5–2px
- Color: white or primary blue (`#3A7BFF`)
- Size: scale with context (16px, 20px, 24px)

**Suggested Icons:**
- Agents → "Bot" or "Zap"
- Breed/Fuse → "Sparkles" or "Dna"
- Mint → "Layers"
- Wallet → "Wallet"
- Dashboard → "LayoutDashboard"
- Settings → "Settings"
- Close → "X"
- Back → "ChevronLeft"
- Success → "CheckCircle"
- Error → "AlertCircle"

---

## 9. ACCESSIBILITY

- ✅ Minimum contrast ratio: 4.5:1 (WCAG AA standard)
- ✅ Text never below 14px on dark backgrounds
- ✅ All interactive elements must have visible focus indicators (outline or glow)
- ✅ Avoid long continuous neon colors
- ✅ Use semantic HTML (`<button>`, `<a>`, `<input>`, etc.)
- ✅ ARIA labels on all custom components
- ✅ Focus trap in modals

---

## 10. CSS VARIABLES REFERENCE

### Colors
```css
--color-primary: #3A7BFF;
--color-secondary: #7B4DFF;
--color-accent: #20E3B2;
--color-danger: #FF5252;
--color-warning: #F4D03F;

--color-bg-base: #0A0F1F;
--color-bg-surface: #161A2B;
--color-bg-surface-alt: #2C3345;

--color-text-primary: #F5F7FA;
--color-text-secondary: #AAB1C1;
--color-text-disabled: #6B7280;

--color-border: #2C3345;
```

### Typography
```css
--font-primary: "Space Grotesk", "Inter", sans-serif;
--font-secondary: "IBM Plex Sans", sans-serif;

--fs-h1: 32px;
--fs-h2: 24px;
--fs-h3: 20px;
--fs-subtitle: 18px;
--fs-body: 16px;
--fs-caption: 14px;
--fs-label: 12px;

--fw-light: 300;
--fw-regular: 400;
--fw-medium: 500;
--fw-semibold: 600;
--fw-bold: 700;
```

### Spacing
```css
--space-xs: 4px;
--space-s: 8px;
--space-m: 16px;
--space-l: 24px;
--space-xl: 32px;
--space-xxl: 48px;
```

### Borders & Shadows
```css
--border-radius-sm: 8px;
--border-radius-md: 12px;
--border-radius-lg: 16px;
--border-radius-xl: 20px;

--shadow-sm: 0px 2px 4px rgba(0, 0, 0, 0.1);
--shadow-md: 0px 4px 16px rgba(0, 0, 0, 0.35);
--shadow-lg: 0px 8px 24px rgba(0, 0, 0, 0.4);
```

---

## 11. RESPONSIVE BREAKPOINTS

```css
--breakpoint-mobile: 320px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1280px;
```

---

## 12. STATE VARIANTS

### Button States
- **Default:** Full opacity
- **Hover:** Lighten color by 8-10%
- **Active:** Darker shade
- **Disabled:** Opacity 0.4, cursor not-allowed
- **Focus:** 2px outline or glow

### Input States
- **Default:** Border color `#2C3345`
- **Focus:** Border color `#3A7BFF`, 2px solid
- **Error:** Border color `#FF5252`, 2px solid
- **Disabled:** Opacity 0.5, background `#0A0F1F`

### Card States
- **Default:** Base shadow
- **Hover:** Enhanced shadow, scale 1.02
- **Selected:** Glowing border `#3A7BFF` 2px solid
- **Disabled:** Opacity 0.5

---

## 13. ANIMATION & MOTION

### Transition Speeds
- **Fast:** 100ms (hover states, icons)
- **Normal:** 150ms (component transitions)
- **Slow:** 300ms (page transitions)

### Easing Functions
- **Default:** `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design)
- **Ease-in:** `cubic-bezier(0.4, 0, 1, 1)`
- **Ease-out:** `cubic-bezier(0, 0, 0.2, 1)`

### Motion Patterns
- **Fade in/out:** Opacity 0 → 1, 150ms
- **Slide:** Transform translateY, 150ms
- **Scale:** Transform scale, 150ms
- **Glow:** Box-shadow expand, 200ms

---

## 14. IMPLEMENTATION NOTES

### For React Developers
- Use **CSS Modules** or **Tailwind CSS** with custom config
- Leverage **Framer Motion** for animations
- Import **Lucide React** for icons
- Create a `theme.ts` file with all design tokens
- Use CSS variables for dynamic theming

### For Design Tools
- This system is compatible with Figma, Sketch, Adobe XD
- Create component library with states (default, hover, active, disabled)
- Use design tokens plugin for automatic updates

### For Quality Assurance
- Test all components in light/dark mode
- Verify accessibility with WAVE or Axe DevTools
- Check responsive behavior at all breakpoints
- Validate color contrast ratios

---

## 15. TOKEN EXPORT (For Copy-Paste)

```json
{
  "colors": {
    "primary": "#3A7BFF",
    "secondary": "#7B4DFF",
    "accent": "#20E3B2",
    "danger": "#FF5252",
    "warning": "#F4D03F",
    "background": "#0A0F1F",
    "surface": "#161A2B",
    "surface_alt": "#2C3345",
    "text_primary": "#F5F7FA",
    "text_secondary": "#AAB1C1",
    "text_disabled": "#6B7280",
    "border": "#2C3345"
  },
  "typography": {
    "font_primary": "Space Grotesk, Inter, sans-serif",
    "font_secondary": "IBM Plex Sans, sans-serif"
  },
  "spacing": {
    "xs": "4px",
    "s": "8px",
    "m": "16px",
    "l": "24px",
    "xl": "32px",
    "xxl": "48px"
  },
  "radius": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "20px"
  }
}
```

---

**Design System Version:** 1.0  
**Last Updated:** November 27, 2025  
**Status:** Ready for Implementation ✅


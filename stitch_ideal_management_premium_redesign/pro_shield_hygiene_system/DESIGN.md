---
name: Pro-Shield Hygiene System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414942'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#717971'
  outline-variant: '#c1c9bf'
  surface-tint: '#366847'
  primary: '#00361a'
  on-primary: '#ffffff'
  primary-container: '#1a4d2e'
  on-primary-container: '#88bd95'
  inverse-primary: '#9dd3aa'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#003617'
  on-tertiary: '#ffffff'
  tertiary-container: '#004f25'
  on-tertiary-container: '#2fca6e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b8f0c5'
  primary-fixed-dim: '#9dd3aa'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#1d5031'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#6dfe9c'
  tertiary-fixed-dim: '#4de082'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  deep-forest: '#1A4D2E'
  warm-gold: '#D4AF37'
  safety-lime: '#4ADE80'
  slate-text: '#2D3436'
  smoke-accent: '#E9ECEF'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 24px
  section-padding: 80px
  element-gap: 16px
  stack-margin: 32px
---

## Brand & Style
The design system embodies a "Clinical Premium" aesthetic. It balances the high-stakes nature of pest management with the sophistication of a high-end service provider. The brand personality is authoritative, systematic, and meticulously clean, designed to instill immediate confidence in both residential and industrial clients.

The visual style is a blend of **Minimalism** and **Corporate Modern**. It utilizes expansive white space to suggest sanitation and clarity, while anchored by a deep, forest-green foundation that represents environmental responsibility and growth. Soft elevation and refined typography move the brand away from "utility" and toward "consultancy."

## Colors
The palette is rooted in a **Deep Forest Green**, used for primary structural elements and high-authority text. This color provides a "grounded" feeling that black often lacks. 

- **Primary (#1A4D2E):** Used for headers, footers, and primary buttons.
- **Secondary/CTA (#D4AF37):** A warm gold reserved for "Book Now" or "Premium Service" prompts to denote value and quality.
- **Accent (#4ADE80):** A vibrant lime green used for "Eco-friendly" badges, success states, and subtle iconography highlights to reference safety and nature.
- **Neutral:** A clean white background is essential to the "clinical" feel, supported by low-saturation grays for surface depth.

## Typography
The typographic hierarchy uses **Montserrat** for all headlines to provide a geometric, sturdy, and authoritative presence. It conveys the "Management" aspect of the brand.

**Inter** is utilized for body text and UI labels. Its high x-height and neutral character ensure maximum readability for technical service descriptions and safety information. 

- Use **display-lg** only for hero sections on desktop.
- **label-bold** should be used in uppercase for small subtitles or "Quick Links" headers.
- Maintain a line-height of 1.6 for body text to ensure the "airy" and approachable clinical feel.

## Layout & Spacing
This design system employs a **Fixed Grid** philosophy for desktop (12 columns, 1200px max-width) to maintain a sense of order and structural integrity. 

- **Vertical Rhythm:** Large sections are separated by 80px (desktop) or 48px (mobile) to allow the design to "breathe," emphasizing the cleanliness of the brand.
- **Component Spacing:** Elements within cards or service blocks use a tight 16px gap to show relatedness, while the cards themselves are separated by 24px gutters.
- **Breakpoints:** 
    - Desktop: 1024px+
    - Tablet: 768px - 1023px (8 columns, 32px margins)
    - Mobile: 0 - 767px (4 columns, 16px margins)

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. This avoids the "flatness" of budget competitors while remaining professional.

- **Base Layer:** Pure white (#FFFFFF) for the primary content canvas.
- **Surface Layer:** Very light gray (#F8F9FA) for section backgrounds to distinguish "Why Choose Us" from "Introduction."
- **Component Shadows:** Cards use a "High-Diffusion" shadow: `0px 4px 20px rgba(26, 77, 46, 0.06)`. This uses a tiny hint of the primary green color in the shadow to create a more natural, sophisticated depth than neutral black.
- **Interactions:** On hover, cards should lift slightly (translate -4px) and the shadow should become more pronounced.

## Shapes
A "Rounded" shape language (0.5rem / 8px) is applied to all interactive elements. This softens the clinical nature of the service, making the brand feel approachable and modern rather than harsh or institutional.

- **Primary Buttons:** 8px rounded corners.
- **Service Cards:** 12px (rounded-lg) to frame images of facilities and pests softly.
- **Icon Containers:** Circular (pill) backgrounds for the "Why Choose Us" icons to differentiate them from the rectangular service cards.

## Components

### Buttons
- **Primary:** Deep Forest Green background, White text. Bold Montserrat.
- **CTA:** Warm Gold background, Deep Forest Green text. Used exclusively for "Get a Quote" or "Call Now."
- **Outline:** Transparent background with 2px Primary border. Used for secondary navigation like "About Us."

### Cards
Service cards feature a top-aligned image with a 12px radius. Content below the image should be center-aligned with the service title in **headline-sm**. A subtle 1px border (#E9ECEF) is used in addition to the ambient shadow for crispness.

### Inputs & Form Fields
Fields use a 1px border in #E9ECEF. On focus, the border transitions to Primary Green with a soft outer glow of the same color at 10% opacity. Labels are always **label-bold**.

### Trust Signals
Icons for value propositions (Expert Technicians, Eco-Friendly) must be contained in a safety-lime (#4ADE80) circular background with a 15% opacity to ensure the green brand identity is reinforced without overwhelming the content.

### Navigation (Top Bar)
A thin, 40px high utility bar sits above the main header, colored in Primary Green with white text for phone and email details. This separates immediate contact info from brand browsing.
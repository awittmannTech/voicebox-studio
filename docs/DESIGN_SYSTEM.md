# Minimal Web Interface - Design System

This document defines the design language for the Voicebox minimal web interface.

## Design Philosophy

**Apple-Inspired Minimalism**: Clean, professional, and focused on content over chrome. The design uses:
- High contrast (98% white background vs. 13% black text)
- Minimal color usage - whitespace and typography do the work
- Green accent (#34C759) used sparingly for primary actions
- Subtle shadows for depth, not heavy borders

## Color Palette

### Base Colors

```css
--background: 0 0% 98%;           /* #FAFAFA - Very light gray background */
--foreground: 0 0% 13%;           /* #212121 - Near black text */
```

### Surface Colors

```css
--card: 0 0% 100%;                /* #FFFFFF - Pure white cards */
--card-foreground: 0 0% 13%;      /* #212121 - Dark text on cards */
```

### Accent Colors (iOS Green)

```css
--accent: 142 76% 36%;            /* #34C759 - iOS system green */
--accent-foreground: 0 0% 100%;   /* #FFFFFF - White text on green */
```

### Secondary Colors

```css
--muted: 0 0% 96%;                /* #F5F5F5 - Very light gray for subtle backgrounds */
--muted-foreground: 0 0% 45%;     /* #737373 - Medium gray for secondary text */
--border: 0 0% 90%;               /* #E5E5E5 - Light border */
--input: 0 0% 90%;                /* #E5E5E5 - Input borders */
```

### Status Colors

```css
--success: 142 76% 36%;           /* Same as accent - green for success */
--warning: 35 91% 62%;            /* #F59E0B - Amber for warnings */
--destructive: 0 84% 60%;         /* #EF4444 - Red for errors/delete */
--info: 221 83% 53%;              /* #3B82F6 - Blue for info */
```

## Typography

### Font Stack

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Monaco, monospace;
```

### Type Scale

```css
/* Headings */
--text-2xl: 1.5rem;    /* 24px - Page titles */
--text-xl: 1.25rem;    /* 20px - Section headers */
--text-lg: 1.125rem;   /* 18px - Card titles */

/* Body */
--text-base: 0.938rem; /* 15px - Primary body text (Apple standard) */
--text-sm: 0.875rem;   /* 14px - Secondary text */
--text-xs: 0.75rem;    /* 12px - Captions, labels */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
```

### Line Heights

- Headings: 1.2
- Body text: 1.5
- Dense UI (tables): 1.4

## Spacing System

**8px Base Grid**:

```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
```

### Layout Spacing

- Container padding: 32px (`--spacing-8`)
- Card gap: 12px (`--spacing-3`)
- Grid gap: 24px (`--spacing-6`)
- Section gap: 48px (`--spacing-12`)

## Elevation & Shadows

```css
/* Card shadow - very subtle, Apple-style */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);

/* Elevated shadow - for dialogs, dropdowns */
--shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.12);

/* Active shadow - green glow for focused primary buttons */
--shadow-active: 0 2px 6px rgba(52, 199, 89, 0.25);
```

## Border Radius

```css
--radius-sm: 8px;      /* Small elements (badges, tags) */
--radius-md: 12px;     /* Cards, inputs */
--radius-lg: 16px;     /* Modals, large containers */
--radius-full: 9999px; /* Pills, rounded buttons */
```

## Animation & Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Key Animations

- Fade in: opacity 0 → 1 (200ms)
- Scale: transform scale(0.95) → scale(1) (200ms)
- Slide up: transform translateY(8px) → translateY(0) (200ms)

## Component Patterns

### Buttons

- **Primary**: Green background (#34C759), white text, full rounded
- **Secondary**: Light gray background, dark text, full rounded
- **Outline**: White background, gray border, full rounded
- **Ghost**: Transparent, hover shows light gray background
- **Sizes**: Small (32px), Default (40px), Large (44px)

### Cards

- White background (#FFFFFF)
- Subtle shadow (`--shadow-card`)
- 12px border radius
- 16px internal padding

### Inputs

- White background
- Light gray border (#E5E5E5)
- 12px border radius
- 40px height (default)
- Focus: Green ring (2px, `--accent`)

### Tables

- No outer borders
- Light horizontal dividers between rows
- 56px row height
- Hover: Very light gray background (#F5F5F5)

### Badges

- Small (24px height), 8px border radius
- **Success**: Green background with white text
- **Warning**: Amber background with white text
- **Error**: Red background with white text
- **Info**: Blue background with white text

## Layout Structure

### Container

- Max-width: 1200px
- Centered with auto margins
- 32px horizontal padding

### Grid Layout

- Desktop (1024px+): `grid-cols-[320px_1fr]` with 24px gap
- Tablet (768px-1023px): Stacked single column
- Mobile (<768px): Single column, reduced padding

### Sections

- Voice Profiles (left): 320px fixed width on desktop
- Generation + Jobs (right): Flex-1 with min-width 600px
- Responsive: Stack vertically on tablets

## Accessibility

- **Color Contrast**: WCAG AAA compliant (>7:1 for body text)
- **Focus Indicators**: 2px green ring on interactive elements
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **ARIA Labels**: Descriptive labels for screen readers
- **Semantic HTML**: Proper heading hierarchy, landmarks

## Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 768px) {
  /* Tablet */
}

@media (min-width: 1024px) {
  /* Desktop - two-column layout */
}

@media (min-width: 1440px) {
  /* Large desktop - increased spacing */
}
```

## Theme Configuration

**Light Theme Only**: No dark mode in MVP to reduce complexity.

**Future Considerations**:
- Dark mode toggle
- User-customizable accent colors
- Density modes (compact, comfortable, spacious)

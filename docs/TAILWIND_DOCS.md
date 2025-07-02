# Tailwind CSS v4 Complete Documentation

## Overview

Tailwind CSS v4 represents a fundamental shift from v3, introducing a CSS-first configuration model, dramatically improved performance via the Rust-powered Oxide engine, and native support for modern CSS features. Released with a focus on simplicity and speed, v4 eliminates the JavaScript configuration file in favor of CSS-native configuration.

**Key Philosophy Changes:**
- CSS-first configuration replacing JavaScript config files
- Automatic content detection eliminating manual setup
- Modern browser-only support dropping legacy compatibility
- Emphasis on native CSS features over custom implementations

## Installation & Setup

### v3 Installation (Legacy)
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```
- Required: `tailwind.config.js`
- Required: `@tailwind` directives in CSS
- Required: Manual content paths configuration

### v4 Installation (Current)
```bash
npm i tailwindcss @tailwindcss/postcss
```

**Package Separation:**
- PostCSS Plugin: `@tailwindcss/postcss`
- CLI Tool: `@tailwindcss/cli` (separate package)

**CSS Setup:**
```css
@import "tailwindcss";
```

**PostCSS Configuration:**
```js
// postcss.config.js
export default {
  plugins: ["@tailwindcss/postcss"],
};
```

**Vite Plugin (Recommended):**
```js
// vite.config.js
import tailwindcss from '@tailwindcss/vite'

export default {
  plugins: [tailwindcss()]
}
```

## Configuration Model

### v3 Configuration
```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        custom: '#123456'
      }
    }
  },
  plugins: []
}
```

### v4 Configuration
```css
@import "tailwindcss";

@theme {
  --color-custom: #123456;
  --font-family-display: "Inter", sans-serif;
  --spacing-custom: 2.5rem;
}
```

**Automatic Features:**
- Content detection (respects `.gitignore`)
- Binary file exclusion
- No manual path configuration needed

## Complete Utility Migration Reference

### Removed Utilities and Replacements

| Deprecated Utility | v4 Replacement |
|-------------------|----------------|
| `bg-opacity-*` | `bg-black/50` |
| `text-opacity-*` | `text-black/50` |
| `border-opacity-*` | `border-black/50` |
| `divide-opacity-*` | `divide-black/50` |
| `ring-opacity-*` | `ring-black/50` |
| `placeholder-opacity-*` | `placeholder-black/50` |
| `flex-shrink-*` | `shrink-*` |
| `flex-grow-*` | `grow-*` |
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `decoration-clone` | `box-decoration-clone` |

### Changed Default Behaviors

| Feature | v3 Default | v4 Default |
|---------|-----------|-----------|
| Border color | `gray-200` | `currentColor` |
| Ring width | `3px` | `1px` |
| Ring color | Blue | `currentColor` |
| Shadow naming | `shadow-sm` | `shadow-xs` |

## New Features in v4

### Performance Enhancements

**Oxide Engine (Rust-Based):**
- Build times: 20+ seconds → <2 seconds
- Near-instant HMR
- Reduced memory usage
- Smaller CSS output

**Enhanced JIT Compiler:**
- More accurate class detection
- Better arbitrary value support
- Improved tree-shaking

### CSS-Native Features

**Native Cascade Layers:**
```css
@layer theme, base, components, utilities;

@layer utilities {
  .custom-util {
    /* Scoped to utilities layer */
  }
}
```

**Custom Properties with @property:**
```css
@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
```

**Modern CSS Support:**
```html
<!-- Conic gradients -->
<div class="bg-conic-to-t from-blue-500">

<!-- 3D transforms -->
<div class="rotate-x-12 rotate-y-6">

<!-- Color mixing -->
<div class="bg-[color-mix(in_srgb,_red_80%,_blue)]">

<!-- Native nesting -->
<style>
  .component {
    @apply flex items-center;
    
    &:hover {
      @apply bg-gray-100;
    }
  }
</style>
```

### Dynamic Utility Values

```html
<!-- v3: Required config for custom values -->
<!-- v4: Works out of the box -->
<div class="grid-cols-15 gap-13 p-17 mt-23 w-97">
  <!-- Any numeric value supported -->
</div>
```

### Advanced Variants

**ARIA State Variants:**
```html
<button class="aria-checked:bg-blue-500 aria-disabled:opacity-50">
  Toggle
</button>
```

**Data Attribute Variants:**
```html
<div class="data-[state=active]:bg-green-500 data-[loading=true]:animate-pulse">
  Content
</div>
```

**:has() Pseudo-class:**
```html
<div class="has-[:focus]:ring-2 has-[img]:p-0">
  <input type="text" />
</div>
```

**Named Group/Peer Variants:**
```html
<div class="group/sidebar">
  <div class="group-hover/sidebar:bg-gray-100">
    <!-- Responds to specific parent hover -->
  </div>
</div>
```

### Container Queries

```html
<!-- Define container -->
<div class="@container">
  <!-- Responsive to container size -->
  <div class="@sm:grid-cols-2 @lg:grid-cols-4">
    
    <!-- Named containers -->
    <div class="@container/sidebar">
      <p class="@sm/sidebar:text-lg">Sidebar content</p>
    </div>
  </div>
</div>

<!-- Container units -->
<div class="w-[50cqw] h-[100cqh] p-[5cqi]">
  <!-- cqw, cqh, cqi, cqb units -->
</div>
```

### Custom Utilities

```css
/* Define custom utilities in CSS */
@utility btn-primary {
  background-color: theme(colors.blue.500);
  color: white;
  padding: theme(spacing.4) theme(spacing.6);
  border-radius: theme(borderRadius.md);
}

@utility text-glow {
  text-shadow: 0 0 20px theme(colors.current);
}
```

### Source Control

```css
/* Safelist dynamic classes */
@source inline("bg-red-500 text-white p-4");

/* Exclude directories from scanning */
@source not {
  "node_modules/**";
  "vendor/**";
  ".git/**";
}
```

### New Utility Classes

**Text Shadows:**
```html
<h1 class="text-shadow-sm text-shadow-lg text-shadow-none">
```

**Masking:**
```html
<div class="mask-gradient mask-image-[url(...)]">
```

**Enhanced Drop Shadows:**
```html
<div class="drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
```

## Default Theme Updates

### OKLCH Color System
- Perceptually uniform color space
- Wider gamut (P3 display support)
- More vibrant, accurate colors
- Better color interpolation

### Typography Enhancements
- Refined font scales
- Improved line-height ratios
- Enhanced letter-spacing defaults

### Spacing System
- More granular scale options
- Better mathematical progression
- Consistent visual rhythm

## Migration Guide

### Automated Migration
```bash
npx @tailwindcss/upgrade
```

### Manual Migration Steps

1. **Remove tailwind.config.js**
   - Convert theme to CSS variables
   - Move custom utilities to @utility

2. **Update package.json**
   ```json
   {
     "devDependencies": {
       "tailwindcss": "^4.0.0",
       "@tailwindcss/postcss": "^4.0.0"
     }
   }
   ```

3. **Update CSS imports**
   ```css
   /* Remove */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   /* Add */
   @import "tailwindcss";
   ```

4. **Find and replace deprecated utilities**
   - Use migration table above
   - Update opacity syntax
   - Fix shadow and flex utilities

5. **Review custom components**
   - Convert to @layer syntax
   - Update variant usage

## Browser Support

### v3 Support Matrix
- Chrome 67+
- Firefox 60+
- Safari 11.1+
- Edge 79+
- IE11 (with polyfills)

### v4 Support Matrix
- Chrome 111+
- Firefox 128+
- Safari 16.4+
- Edge 111+
- **No IE support**
- **No legacy browser support**

## Best Practices

### Performance Optimization
```css
/* Use @source to exclude large directories */
@source not {
  "public/assets/**";
  "dist/**";
}

/* Leverage cascade layers for specificity control */
@layer utilities {
  /* Custom utilities here */
}
```

### Modern CSS Integration
```css
/* Combine Tailwind with native CSS features */
.component {
  @apply flex items-center;
  
  /* Native nesting */
  & > .child {
    @apply px-4;
  }
  
  /* Container queries */
  @container (min-width: 400px) {
    @apply grid-cols-2;
  }
}
```

### Theme Configuration
```css
@theme {
  /* Use CSS custom properties */
  --color-brand: oklch(59.96% 0.202 256.8);
  
  /* Reference other theme values */
  --color-brand-dark: color-mix(
    in oklch,
    var(--color-brand) 80%,
    black
  );
}
```

### Component Architecture
```html
<!-- Use semantic, accessible markup -->
<article class="@container">
  <header class="
    flex items-center justify-between
    has-[h1]:pb-4
    aria-[current=page]:border-b
  ">
    <h1 class="text-2xl @sm:text-3xl">Title</h1>
  </header>
</article>
```

## Summary

Tailwind CSS v4 represents a complete reimagining of the framework, prioritizing:
- **Simplicity**: No configuration files, automatic content detection
- **Performance**: Rust-powered builds, smaller outputs
- **Modern CSS**: Native features, cascade layers, container queries
- **Developer Experience**: Instant feedback, minimal setup

For new projects starting in 2025, v4 is the definitive choice. Legacy projects should migrate unless constrained by browser support requirements.
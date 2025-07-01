Tailwind CSS v4 (including 4.1.11) introduces a significantly different setup process compared to v3, with a strong emphasis on a CSS-first configuration model and a much-simplified installation workflow.

Key differences and recommendations as of July 2025:

No more tailwind.config.js:
In v4, you configure your theme and custom utilities directly in your CSS using the @theme directive and CSS variables, rather than managing a separate JavaScript config file.

Simplified installation:
Install Tailwind v4 with:

text
npm i tailwindcss @tailwindcss/postcss
Then, in your CSS file:

text
@import "tailwindcss";
And configure PostCSS:

js
// postcss.config.js
export default {
  plugins: ["@tailwindcss/postcss"],
};
That’s it—no need for @tailwind directives or complex config files.

Automatic content detection:
Tailwind v4 automatically scans your project for template files, so you no longer need to specify a content array.

Dynamic utilities and variants:
v4 allows arbitrary properties and values directly in your HTML, making it more flexible for custom styles.

Performance:
v4 is dramatically faster, with a new engine, improved build times, and better support for modern CSS features.

Browser support:
v4 targets modern browsers only (Safari 16.4+, Chrome 111+, Firefox 128+). If you need legacy browser support, stick with v3.4.

Recommended approach as of today:

For new projects: Use Tailwind CSS v4 for its speed, simplicity, and modern features. The setup is minimal and the CSS-first config is now the standard.

For existing v3 projects: Use the official upgrade tool (npx @tailwindcss/upgrade) to migrate, but review the changes, especially if you have complex customizations.

If you require legacy browser support: Stay on v3.4 until your requirements change.

Summary table:

Feature/Step	Tailwind v3	Tailwind v4 (4.1.11)
Configuration	tailwind.config.js (JS)	@theme in CSS (CSS-first)
Installation	Multiple steps, more boilerplate	One-liner install, minimal config
Content detection	Manual content array	Automatic, no config needed
Custom utilities	Extend in JS config	Define as CSS variables
Arbitrary properties	Limited, bracket notation	Full support, [property:value]
Browser support	Broad (incl. older browsers)	Modern browsers only
Bottom line:
Tailwind CSS v4 is the recommended version for most projects as of July 2025 due to its streamlined setup, modern CSS support, and improved developer experience. Only use v3 if you have specific legacy requirements.
// Phones get the lite start (2026-10-08, to meet Google's 2.5s LCP mark):
// no launch intro and no on-load entrances, so text paints with the HTML.
// Scroll animations, Nova and the 3D marks still run. The inline script in
// the root layout sets the `lite` class before the first paint; everything
// else reads it from there, so the decision is made once per page load.

export const LITE_QUERY = "(max-width: 767px)";

export const isLite = () => typeof document !== "undefined" && document.documentElement.classList.contains("lite");

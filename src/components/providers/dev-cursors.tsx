// Custom cursors (part 09), development only. The files are placeholders from
// the reference in public/_ref/ (gitignored, in the placeholder register in
// docs/CONTENT.md), so they never ship: production keeps the system cursors
// until Skyline's own are drawn, then these rules move to globals.css.

const CURSORS = `
@media (pointer: fine) {
  body, body * { cursor: url("/_ref/cursors/default.svg") 3 0, auto; }
  body :is(p, h1, h2, h3, h4, h5, h6, input[type="text"], input[type="email"], textarea),
  body :is([data-cursor="text"], [data-cursor="text"] *) { cursor: url("/_ref/cursors/text.svg") 14 29, text; }
  body :is(a, a *, button, button *, select, label, input[type="submit"], input[type="checkbox"], input[type="radio"]),
  body :is([data-cursor="pointer"], [data-cursor="pointer"] *) { cursor: url("/_ref/cursors/pointer.svg") 18 0, pointer; }
  body :is([data-cursor="grab"], [data-cursor="grab"] *) { cursor: url("/_ref/cursors/grab.svg") 18 6, grab; }
  body :is([data-cursor="grabbing"], [data-cursor="grabbing"] *) { cursor: url("/_ref/cursors/grabbing.svg") 18 0, grabbing; }
  body :is([data-cursor="default"], [data-cursor="default"] *) { cursor: url("/_ref/cursors/default.svg") 3 0, auto; }
}`;

export function DevCursors() {
  if (process.env.NODE_ENV === "production") return null;
  return <style>{CURSORS}</style>;
}

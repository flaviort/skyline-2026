// Shapes of the case studies exported once from the old WordPress (scripts/export-wordpress.mjs).

export type ImageMedia = { type: "image"; src: string; width: number; height: number };
export type VideoMedia = { type: "video"; src: string; poster: string; width: number; height: number };
export type Media = ImageMedia | VideoMedia;

export type ProjectBlock =
  /** Label on the left, optional heading, paragraphs (may hold <strong> and <em>) */
  | { type: "text"; label: string; title?: string; body: string[] }
  /** One big piece of media, optionally on a colored band; `backdrop` shows it blurred behind itself */
  | { type: "feature"; media: Media; background?: string; backdrop?: true }
  /** Full-bleed media */
  | { type: "full"; media: Media }
  /** Three across */
  | { type: "grid"; items: Media[] }
  /** Two full-height halves */
  | { type: "pair"; items: Media[] }
  /** Draggable row */
  | { type: "slider"; items: Media[] }
  /** Two rows running in opposite directions */
  | { type: "marquee"; rows: Media[][] }
  /** A center piece that grows to the full screen while six others fall away around it */
  | { type: "mosaic"; center: Media; around: Media[] };

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  industries: string[];
  year: number;
  url?: string;
  /** The brand color from the old site */
  color: string;
  cover: Media;
  blocks: ProjectBlock[];
};

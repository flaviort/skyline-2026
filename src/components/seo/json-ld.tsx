/** Structured data for search engines, rendered as one JSON-LD script. */
export function JsonLd({ data }: { data: object | object[] }) {
  // "<" is escaped so no string in the data can close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

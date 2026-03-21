/**
 * Build a \usepackage[...]{geometry} line based on paper size and orientation.
 * Returns empty string when defaults are used (A4 portrait).
 */
export function buildGeometryLine(paperSize, landscape) {
  if (paperSize === "a4paper" && !landscape) return "";
  const opts = [];
  if (paperSize !== "a4paper") opts.push(paperSize);
  if (landscape) opts.push("landscape");
  opts.push("top=2cm", "bottom=2cm", "left=3cm", "right=3cm");
  return `\\usepackage[${opts.join(",")}]{geometry}\n`;
}

import libSlugify from "slugify";

export function slugify(raw: string): string {
  return libSlugify(raw, { lower: true });
}

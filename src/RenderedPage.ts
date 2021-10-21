import { PageMeta } from "./PageMeta";

export interface RenderedPage {
  file: string;
  meta: PageMeta;
  properties: Record<string, any>;
}

import { PageMeta } from "./PageProperties";

export interface RenderedPage {
  file: string;
  meta: PageMeta;
  properties: Record<string, any>;
}

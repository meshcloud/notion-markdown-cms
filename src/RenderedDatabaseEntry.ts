export interface RenderedDatabaseEntry {
  meta: {
    id: string;
    url: string;
  };
  properties: Record<string, any>;
}

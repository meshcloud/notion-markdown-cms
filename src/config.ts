import {
  DatabaseConfig,
  DatabaseConfigRenderPages,
  DatabaseConfigRenderTable,
} from "./SyncConfig";
import { SyncConfig } from ".";

export function lookupDatabaseConfig(
  config: SyncConfig,
  databaseId: string | null
): DatabaseConfig {
  const rootCmsDbConfig: DatabaseConfigRenderPages = {
    outDir: config.outDir,
    renderAs: "pages+views",
    pages: {
      frontmatter: {
        category: {
          property: "Category",
        },
      },
    },
    views: [],
  };
  const defaultDbConfig: DatabaseConfigRenderTable = {
    outDir: config.outDir + "/" + databaseId,
    renderAs: "table",
    entries: {
      emitToIndex: false,
    },
  };

  const fallbackDbConfig: DatabaseConfig =
    databaseId === config.cmsDatabaseId ? rootCmsDbConfig : defaultDbConfig;

  if (!databaseId || !config.databases[databaseId]) {
    return fallbackDbConfig;
  }

  return config.databases[databaseId];
}

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
    renderAs: "pages+views",
    pages: config.pages,
    views: [],
  };
  const defaultDbConfig: DatabaseConfigRenderTable = {
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

import { DatabaseConfig } from "./SyncConfig";
import { SyncConfig } from ".";

export function lookupDatabaseConfig(
  config: SyncConfig,
  databaseId: string | null
): DatabaseConfig {
  const fallbackDbConfig: DatabaseConfig = {
    outDir:
      databaseId === config.cmsDatabaseId
        ? config.outDir
        : config.outDir + "/" + databaseId,
    properties: {
      category: "Category",
    },
  };

  if (!databaseId || !config.databases[databaseId]) {
    return fallbackDbConfig;
  }

  return config.databases[databaseId];
}

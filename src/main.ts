import { config as dotenv } from "dotenv";
import { promises as fs } from "fs";

import { SyncConfig } from "./SyncConfig";
import { sync } from "./sync"; 
dotenv();

async function main(args: string[]) {
  const notionApiToken = process.env.NOTION_API_TOKEN;
  if(!notionApiToken){
    throw new Error("Required NOTION_API_TOKEN environment variable not provided.")
  }

  const configPath = args[0] || "./config.json";
  const config = JSON.parse(
    await fs.readFile(configPath, { encoding: "utf-8" })
  ) as SyncConfig;

  await sync(notionApiToken, config);
}

main(process.argv.slice(2));
 
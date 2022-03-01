import { promises as fs } from "fs";
import got from "got";
import { KeyvFile } from "keyv-file";
import * as mime from "mime-types";
import { RenderingContextLogger } from "./RenderingContextLogger";

const cache = new KeyvFile({
  filename: ".cache/keyv.json",
});

export class AssetWriter {
  constructor(
    private readonly dir: string,
    private readonly logger: RenderingContextLogger
  ) {}

  async store(name: string, buffer: Buffer) {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(`${this.dir}/${name}`, buffer);
  }

  async download(url: string, fileName: string) {
    // the got http lib promises to do proper user-agent compliant http caching
    // see https://github.com/sindresorhus/got/blob/main/documentation/cache.md

    // unfortunately download caching does _not_ work with images hosted on notion
    // because the notion API does not return cache friendly signed S3 URLs, https://advancedweb.hu/cacheable-s3-signed-urls/
    const response = await got(url, { cache });

    const ext = mime.extension(
      response.headers["content-type"] || "application/octet-stream"
    );
    const imageFile = fileName + "." + ext;

    const cacheInfo = response.isFromCache ? " (from cache)" : "";
    this.logger.info(`downloading ${imageFile}` + cacheInfo);
    await this.store(imageFile, response.rawBody);

    return imageFile;
  }
}

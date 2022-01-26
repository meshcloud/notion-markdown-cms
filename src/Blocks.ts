import {
    Block as PublicBlock, BlockBase, Emoji, ExternalFile, ExternalFileWithCaption, File,
    FileWithCaption, ImageBlock, RichText
} from '@notionhq/client/build/src/api-types';

export interface CodeBlock extends BlockBase {
  type: "code";
  code: {
    text: RichText[];
    language: string;
  };
}

export interface QuoteBlock extends BlockBase {
  type: "quote";
  quote: {
    text: RichText[];
    language: string;
  };
}

export interface CalloutBlock extends BlockBase {
  type: "callout";
  callout: {
    text: RichText[];
    icon: File | ExternalFile | Emoji;
  };
}

export interface DividerBlock extends BlockBase {
  type: "divider";
}

export interface ChildDatabaseBlock extends BlockBase {
  type: "child_database";
}

// these are blocks that the notion API client code does not have proper typings for
// for unknown reasons they removed types alltogether in v0.4 of the client
// https://github.com/makenotion/notion-sdk-js/pulls?q=is%3Apr+is%3Aclosed#issuecomment-927781781
export type Block =
  | PublicBlock
  | CodeBlock
  | QuoteBlock
  | CalloutBlock
  | DividerBlock
  | ChildDatabaseBlock;

export {
  Emoji,
  ExternalFile,
  ExternalFileWithCaption,
  File,
  FileWithCaption,
  ImageBlock,
};

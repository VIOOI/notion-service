/**
 * @fileoverview Block types and content structures for Notion API
 * @module @notion-sdk/types/blocks
 */

import { Array, Effect, Either, Option, pipe, Schema } from "effect";
import type { A, B, F, L, N, O, S, U } from "ts-toolbelt";
import type {
  File,
  FileWithCaption,
  Icon,
  ISODateString,
  NotionColor,
  Parent,
  PartialUser,
  RichText,
  User,
  UUID,
} from "./core-types.ts";

// ============================================================================
// Block Types Enumeration
// ============================================================================

/**
 * All available block types in Notion
 */
export const BlockType = {
  PARAGRAPH: "paragraph",
  HEADING_1: "heading_1",
  HEADING_2: "heading_2",
  HEADING_3: "heading_3",
  BULLETED_LIST_ITEM: "bulleted_list_item",
  NUMBERED_LIST_ITEM: "numbered_list_item",
  TO_DO: "to_do",
  TOGGLE: "toggle",
  CHILD_PAGE: "child_page",
  CHILD_DATABASE: "child_database",
  EMBED: "embed",
  IMAGE: "image",
  VIDEO: "video",
  FILE: "file",
  PDF: "pdf",
  BOOKMARK: "bookmark",
  CALLOUT: "callout",
  QUOTE: "quote",
  EQUATION: "equation",
  DIVIDER: "divider",
  TABLE_OF_CONTENTS: "table_of_contents",
  COLUMN_LIST: "column_list",
  COLUMN: "column",
  LINK_PREVIEW: "link_preview",
  SYNCED_BLOCK: "synced_block",
  TEMPLATE: "template",
  LINK_TO_PAGE: "link_to_page",
  TABLE: "table",
  TABLE_ROW: "table_row",
  BREADCRUMB: "breadcrumb",
  CODE: "code",
  AUDIO: "audio",
} as const;

export type BlockType = (typeof BlockType)[keyof typeof BlockType];

// ============================================================================
// Base Block Interface
// ============================================================================

/**
 * Base block structure shared by all block types
 */
export interface BaseBlock {
  readonly object: "block";
  readonly id: UUID;
  readonly parent: Parent;
  readonly created_time: ISODateString;
  readonly created_by: PartialUser;
  readonly last_edited_time: ISODateString;
  readonly last_edited_by: PartialUser;
  readonly archived: boolean;
  readonly has_children: boolean;
}

// ============================================================================
// Text Block Types
// ============================================================================

/**
 * Paragraph block
 */
export interface ParagraphBlock extends BaseBlock {
  readonly type: "paragraph";
  readonly paragraph: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly color: NotionColor;
  };
}

/**
 * Heading 1 block
 */
export interface Heading1Block extends BaseBlock {
  readonly type: "heading_1";
  readonly heading_1: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly color: NotionColor;
    readonly is_toggleable: boolean;
  };
}

/**
 * Heading 2 block
 */
export interface Heading2Block extends BaseBlock {
  readonly type: "heading_2";
  readonly heading_2: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly color: NotionColor;
    readonly is_toggleable: boolean;
  };
}

/**
 * Heading 3 block
 */
export interface Heading3Block extends BaseBlock {
  readonly type: "heading_3";
  readonly heading_3: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly color: NotionColor;
    readonly is_toggleable: boolean;
  };
}

/**
 * Bulleted list item block
 */
export interface BulletedListItemBlock extends BaseBlock {
  readonly type: "bulleted_list_item";
  readonly bulleted_list_item: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly color: NotionColor;
  };
}

/**
 * Numbered list item block
 */
export interface NumberedListItemBlock extends BaseBlock {
  readonly type: "numbered_list_item";
  readonly numbered_list_item: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly color: NotionColor;
  };
}

/**
 * To-do block
 */
export interface ToDoBlock extends BaseBlock {
  readonly type: "to_do";
  readonly to_do: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly checked: boolean;
    readonly color: NotionColor;
  };
}

/**
 * Toggle block
 */
export interface ToggleBlock extends BaseBlock {
  readonly type: "toggle";
  readonly toggle: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly color: NotionColor;
  };
}

/**
 * Quote block
 */
export interface QuoteBlock extends BaseBlock {
  readonly type: "quote";
  readonly quote: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly color: NotionColor;
  };
}

/**
 * Callout block
 */
export interface CalloutBlock extends BaseBlock {
  readonly type: "callout";
  readonly callout: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly icon: Option.Option<Icon>;
    readonly color: NotionColor;
  };
}

// ============================================================================
// Code Block
// ============================================================================

/**
 * Programming language enumeration
 */
export const CodeLanguage = {
  ABAP: "abap",
  ARDUINO: "arduino",
  BASH: "bash",
  BASIC: "basic",
  C: "c",
  CLOJURE: "clojure",
  COFFEESCRIPT: "coffeescript",
  CPP: "c++",
  CSHARP: "c#",
  CSS: "css",
  DART: "dart",
  DIFF: "diff",
  DOCKER: "docker",
  ELIXIR: "elixir",
  ELM: "elm",
  ERLANG: "erlang",
  FLOW: "flow",
  FORTRAN: "fortran",
  FSHARP: "f#",
  GHERKIN: "gherkin",
  GLSL: "glsl",
  GO: "go",
  GRAPHQL: "graphql",
  GROOVY: "groovy",
  HASKELL: "haskell",
  HTML: "html",
  JAVA: "java",
  JAVASCRIPT: "javascript",
  JSON: "json",
  JULIA: "julia",
  KOTLIN: "kotlin",
  LATEX: "latex",
  LESS: "less",
  LISP: "lisp",
  LIVESCRIPT: "livescript",
  LUA: "lua",
  MAKEFILE: "makefile",
  MARKDOWN: "markdown",
  MARKUP: "markup",
  MATLAB: "matlab",
  MERMAID: "mermaid",
  NIX: "nix",
  OBJECTIVE_C: "objective-c",
  OCAML: "ocaml",
  PASCAL: "pascal",
  PERL: "perl",
  PHP: "php",
  PLAIN_TEXT: "plain text",
  POWERSHELL: "powershell",
  PROLOG: "prolog",
  PROTOBUF: "protobuf",
  PYTHON: "python",
  R: "r",
  REASON: "reason",
  RUBY: "ruby",
  RUST: "rust",
  SASS: "sass",
  SCALA: "scala",
  SCHEME: "scheme",
  SCSS: "scss",
  SHELL: "shell",
  SQL: "sql",
  SWIFT: "swift",
  TYPESCRIPT: "typescript",
  VB_NET: "vb.net",
  VERILOG: "verilog",
  VHDL: "vhdl",
  VISUAL_BASIC: "visual basic",
  WEBASSEMBLY: "webassembly",
  XML: "xml",
  YAML: "yaml",
} as const;

export type CodeLanguage = (typeof CodeLanguage)[keyof typeof CodeLanguage];

/**
 * Code block
 */
export interface CodeBlock extends BaseBlock {
  readonly type: "code";
  readonly code: {
    readonly rich_text: ReadonlyArray<RichText>;
    readonly caption: ReadonlyArray<RichText>;
    readonly language: CodeLanguage;
  };
}

// ============================================================================
// Media Block Types
// ============================================================================

/**
 * Image block
 */
export interface ImageBlock extends BaseBlock {
  readonly type: "image";
  readonly image: FileWithCaption;
}

/**
 * Video block
 */
export interface VideoBlock extends BaseBlock {
  readonly type: "video";
  readonly video: FileWithCaption;
}

/**
 * Audio block
 */
export interface AudioBlock extends BaseBlock {
  readonly type: "audio";
  readonly audio: FileWithCaption;
}

/**
 * File block
 */
export interface FileBlock extends BaseBlock {
  readonly type: "file";
  readonly file: FileWithCaption;
}

/**
 * PDF block
 */
export interface PDFBlock extends BaseBlock {
  readonly type: "pdf";
  readonly pdf: FileWithCaption;
}

// ============================================================================
// Embed and Link Block Types
// ============================================================================

/**
 * Embed block
 */
export interface EmbedBlock extends BaseBlock {
  readonly type: "embed";
  readonly embed: {
    readonly url: string;
    readonly caption: ReadonlyArray<RichText>;
  };
}

/**
 * Bookmark block
 */
export interface BookmarkBlock extends BaseBlock {
  readonly type: "bookmark";
  readonly bookmark: {
    readonly url: string;
    readonly caption: ReadonlyArray<RichText>;
  };
}

/**
 * Link preview block
 */
export interface LinkPreviewBlock extends BaseBlock {
  readonly type: "link_preview";
  readonly link_preview: {
    readonly url: string;
  };
}

/**
 * Link to page block
 */
export interface LinkToPageBlock extends BaseBlock {
  readonly type: "link_to_page";
  readonly link_to_page:
    | { readonly type: "page_id"; readonly page_id: UUID }
    | { readonly type: "database_id"; readonly database_id: UUID };
}

// ============================================================================
// Structural Block Types
// ============================================================================

/**
 * Child page block
 */
export interface ChildPageBlock extends BaseBlock {
  readonly type: "child_page";
  readonly child_page: {
    readonly title: string;
  };
}

/**
 * Child database block
 */
export interface ChildDatabaseBlock extends BaseBlock {
  readonly type: "child_database";
  readonly child_database: {
    readonly title: string;
  };
}

/**
 * Column list block
 */
export interface ColumnListBlock extends BaseBlock {
  readonly type: "column_list";
  readonly column_list: Record<string, never>;
}

/**
 * Column block
 */
export interface ColumnBlock extends BaseBlock {
  readonly type: "column";
  readonly column: Record<string, never>;
}

/**
 * Table block
 */
export interface TableBlock extends BaseBlock {
  readonly type: "table";
  readonly table: {
    readonly table_width: number;
    readonly has_column_header: boolean;
    readonly has_row_header: boolean;
  };
}

/**
 * Table row block
 */
export interface TableRowBlock extends BaseBlock {
  readonly type: "table_row";
  readonly table_row: {
    readonly cells: ReadonlyArray<ReadonlyArray<RichText>>;
  };
}

// ============================================================================
// Special Block Types
// ============================================================================

/**
 * Equation block
 */
export interface EquationBlock extends BaseBlock {
  readonly type: "equation";
  readonly equation: {
    readonly expression: string;
  };
}

/**
 * Divider block
 */
export interface DividerBlock extends BaseBlock {
  readonly type: "divider";
  readonly divider: Record<string, never>;
}

/**
 * Table of contents block
 */
export interface TableOfContentsBlock extends BaseBlock {
  readonly type: "table_of_contents";
  readonly table_of_contents: {
    readonly color: NotionColor;
  };
}

/**
 * Breadcrumb block
 */
export interface BreadcrumbBlock extends BaseBlock {
  readonly type: "breadcrumb";
  readonly breadcrumb: Record<string, never>;
}

/**
 * Synced block (original)
 */
export interface SyncedBlockOriginal extends BaseBlock {
  readonly type: "synced_block";
  readonly synced_block: {
    readonly synced_from: null;
  };
}

/**
 * Synced block (reference)
 */
export interface SyncedBlockReference extends BaseBlock {
  readonly type: "synced_block";
  readonly synced_block: {
    readonly synced_from: {
      readonly type: "block_id";
      readonly block_id: UUID;
    };
  };
}

/**
 * Synced block union type
 */
export type SyncedBlock = SyncedBlockOriginal | SyncedBlockReference;

/**
 * Template block
 */
export interface TemplateBlock extends BaseBlock {
  readonly type: "template";
  readonly template: {
    readonly rich_text: ReadonlyArray<RichText>;
  };
}

// ============================================================================
// Block Union Type
// ============================================================================

/**
 * Union of all block types
 */
export type Block =
  | ParagraphBlock
  | Heading1Block
  | Heading2Block
  | Heading3Block
  | BulletedListItemBlock
  | NumberedListItemBlock
  | ToDoBlock
  | ToggleBlock
  | QuoteBlock
  | CalloutBlock
  | CodeBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | FileBlock
  | PDFBlock
  | EmbedBlock
  | BookmarkBlock
  | LinkPreviewBlock
  | LinkToPageBlock
  | ChildPageBlock
  | ChildDatabaseBlock
  | ColumnListBlock
  | ColumnBlock
  | TableBlock
  | TableRowBlock
  | EquationBlock
  | DividerBlock
  | TableOfContentsBlock
  | BreadcrumbBlock
  | SyncedBlock
  | TemplateBlock;

/**
 * Partial block type (used in responses before full retrieval)
 */
export interface PartialBlock extends
  Pick<
    BaseBlock,
    | "object"
    | "id"
    | "parent"
    | "created_time"
    | "last_edited_time"
    | "archived"
    | "has_children"
  > {
  readonly type: BlockType;
}

// ============================================================================
// Block Creation Types
// ============================================================================

/**
 * Type for creating new blocks (without system fields)
 */
export type CreateBlock<T extends Block> = Omit<
  T,
  | "object"
  | "id"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by"
  | "parent"
  | "archived"
  | "has_children"
>;

/**
 * Helper type for block creation requests
 */
export type BlockCreateRequest = {
  readonly [K in BlockType]: CreateBlock<Extract<Block, { type: K }>>;
}[BlockType];

/**
 * Helper type for block update requests
 */
export type BlockUpdateRequest = Partial<BlockCreateRequest> & {
  readonly archived?: boolean;
};

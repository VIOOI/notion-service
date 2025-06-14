/**
 * @fileoverview Comprehensive Notion API type definitions with Effect-ts and ts-toolbelt
 * @module @notion-sdk/types
 * @requires Effect-ts, ts-toolbelt
 */

import { Array, Brand, Effect, Either, Option, pipe, Schema } from "effect";
import type { A, B, F, L, N, O, S, U } from "ts-toolbelt";

// ============================================================================
// Base Types and Constants
// ============================================================================

/**
 * UUID v4 format for Notion identifiers
 * @example "110e8400-e29b-11d4-a716-446655440000"
 */
// export type UUID = S.Format<string, "uuid">;
export type UUID = string & Brand.Brand<"uuid">;

export const UUID = Brand.nominal<UUID>();

/**
 * ISO 8601 date string
 * @example "2023-01-01T00:00:00.000Z"
 */
// export type ISODateString = S.Format<string, "iso-date">;
export type ISODateString = string & Brand.Brand<"iso-date">;

export const ISODateString = Brand.nominal<ISODateString>();

/**
 * Hex color value
 * @example "#FF5733"
 */
// export type HexColor = S.Format<string, "hex-color">;
export type HexColor = string & Brand.Brand<"hex-color">;

export const HexColor = Brand.nominal<HexColor>();

/**
 * API Version constant
 */
export const API_VERSION = "2022-06-28" as const;

/**
 * Notion object types enumeration
 */
export const NotionObjectType = {
  DATABASE: "database",
  PAGE: "page",
  BLOCK: "block",
  USER: "user",
  COMMENT: "comment",
  PROPERTY_ITEM: "property_item",
  LIST: "list",
  ERROR: "error",
} as const;

export type NotionObjectType =
  (typeof NotionObjectType)[keyof typeof NotionObjectType];

// ============================================================================
// Color Types
// ============================================================================

/**
 * Available colors in Notion
 */
export const NotionColor = {
  DEFAULT: "default",
  GRAY: "gray",
  BROWN: "brown",
  ORANGE: "orange",
  YELLOW: "yellow",
  GREEN: "green",
  BLUE: "blue",
  PURPLE: "purple",
  PINK: "pink",
  RED: "red",
  GRAY_BACKGROUND: "gray_background",
  BROWN_BACKGROUND: "brown_background",
  ORANGE_BACKGROUND: "orange_background",
  YELLOW_BACKGROUND: "yellow_background",
  GREEN_BACKGROUND: "green_background",
  BLUE_BACKGROUND: "blue_background",
  PURPLE_BACKGROUND: "purple_background",
  PINK_BACKGROUND: "pink_background",
  RED_BACKGROUND: "red_background",
} as const;

export type NotionColor = (typeof NotionColor)[keyof typeof NotionColor];

// ============================================================================
// Rich Text Types
// ============================================================================

/**
 * Text annotations for rich text
 */
export interface RichTextAnnotations {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly strikethrough: boolean;
  readonly underline: boolean;
  readonly code: boolean;
  readonly color: NotionColor;
}

/**
 * Base rich text type
 */
export interface BaseRichText {
  readonly type: string;
  readonly annotations: RichTextAnnotations;
  readonly plain_text: string;
  readonly href: Option.Option<string>;
}

/**
 * Text rich text type
 */
export interface TextRichText extends BaseRichText {
  readonly type: "text";
  readonly text: {
    readonly content: string;
    readonly link: Option.Option<{ readonly url: string }>;
  };
}

/**
 * Mention types
 */
export const MentionType = {
  USER: "user",
  PAGE: "page",
  DATABASE: "database",
  DATE: "date",
  LINK_PREVIEW: "link_preview",
} as const;

export type MentionType = (typeof MentionType)[keyof typeof MentionType];

/**
 * Mention rich text type
 */
export interface MentionRichText extends BaseRichText {
  readonly type: "mention";
  readonly mention:
    | { readonly type: "user"; readonly user: PartialUser | User }
    | { readonly type: "page"; readonly page: { readonly id: UUID } }
    | { readonly type: "database"; readonly database: { readonly id: UUID } }
    | { readonly type: "date"; readonly date: DatePropertyValue }
    | {
      readonly type: "link_preview";
      readonly link_preview: { readonly url: string };
    };
}

/**
 * Equation rich text type
 */
export interface EquationRichText extends BaseRichText {
  readonly type: "equation";
  readonly equation: {
    readonly expression: string;
  };
}

/**
 * Union of all rich text types
 */
export type RichText = TextRichText | MentionRichText | EquationRichText;

// ============================================================================
// User Types
// ============================================================================

/**
 * User type enumeration
 */
export const UserType = {
  PERSON: "person",
  BOT: "bot",
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];

/**
 * Partial user object (commonly returned in responses)
 */
export interface PartialUser {
  readonly object: "user";
  readonly id: UUID;
}

/**
 * Person user type
 */
export interface PersonUser extends PartialUser {
  readonly type: "person";
  readonly person: {
    readonly email: string;
  };
  readonly name: Option.Option<string>;
  readonly avatar_url: Option.Option<string>;
}

/**
 * Bot user type
 */
export interface BotUser extends PartialUser {
  readonly type: "bot";
  readonly bot: {
    readonly owner: {
      readonly type: "workspace" | "user";
      readonly workspace?: boolean;
      readonly user?: PartialUser | User;
    };
    readonly workspace_name: Option.Option<string>;
  };
  readonly name: Option.Option<string>;
  readonly avatar_url: Option.Option<string>;
}

/**
 * Union of all user types
 */
export type User = PersonUser | BotUser;

// ============================================================================
// File Types
// ============================================================================

/**
 * External file type
 */
export interface ExternalFile {
  readonly type: "external";
  readonly external: {
    readonly url: string;
  };
}

/**
 * Notion-hosted file type
 */
export interface NotionFile {
  readonly type: "file";
  readonly file: {
    readonly url: string;
    readonly expiry_time: ISODateString;
  };
}

/**
 * Union of file types
 */
export type File = ExternalFile | NotionFile;

/**
 * File with caption
 */
export type FileWithCaption = File & {
  readonly caption: Array<RichText>;
  readonly name: string;
};

// ============================================================================
// Emoji and Icon Types
// ============================================================================

/**
 * Emoji icon type
 */
export interface EmojiIcon {
  readonly type: "emoji";
  readonly emoji: string;
}

/**
 * File icon type
 */
export interface FileIcon {
  readonly type: "external" | "file";
  readonly external?: { readonly url: string };
  readonly file?: {
    readonly url: string;
    readonly expiry_time: ISODateString;
  };
}

/**
 * Union of icon types
 */
export type Icon = EmojiIcon | FileIcon;

// ============================================================================
// Parent Types
// ============================================================================

/**
 * Database parent type
 */
export interface DatabaseParent {
  readonly type: "database_id";
  readonly database_id: UUID;
}

/**
 * Page parent type
 */
export interface PageParent {
  readonly type: "page_id";
  readonly page_id: UUID;
}

/**
 * Workspace parent type
 */
export interface WorkspaceParent {
  readonly type: "workspace";
  readonly workspace: true;
}

/**
 * Block parent type
 */
export interface BlockParent {
  readonly type: "block_id";
  readonly block_id: UUID;
}

/**
 * Union of parent types
 */
export type Parent =
  | DatabaseParent
  | PageParent
  | WorkspaceParent
  | BlockParent;

// ============================================================================
// Property Value Types
// ============================================================================

/**
 * Number property value
 */
export interface NumberPropertyValue {
  readonly type: "number";
  readonly number: Option.Option<number>;
}

/**
 * Select option
 */
export interface SelectOption {
  readonly id: UUID;
  readonly name: string;
  readonly color: NotionColor;
}

/**
 * Select property value
 */
export interface SelectPropertyValue {
  readonly type: "select";
  readonly select: Option.Option<SelectOption>;
}

/**
 * Multi-select property value
 */
export interface MultiSelectPropertyValue {
  readonly type: "multi_select";
  readonly multi_select: Array<SelectOption>;
}

/**
 * Date property value
 */
export interface DatePropertyValue {
  readonly type: "date";
  readonly date: Option.Option<{
    readonly start: ISODateString;
    readonly end: Option.Option<ISODateString>;
    readonly time_zone: Option.Option<string>;
  }>;
}

/**
 * Formula property value types
 */
export type FormulaPropertyValue =
  | {
    readonly type: "formula";
    readonly formula: {
      readonly type: "string";
      readonly string: Option.Option<string>;
    };
  }
  | {
    readonly type: "formula";
    readonly formula: {
      readonly type: "number";
      readonly number: Option.Option<number>;
    };
  }
  | {
    readonly type: "formula";
    readonly formula: {
      readonly type: "boolean";
      readonly boolean: Option.Option<boolean>;
    };
  }
  | {
    readonly type: "formula";
    readonly formula: {
      readonly type: "date";
      readonly date: Option.Option<DatePropertyValue["date"]>;
    };
  };

/**
 * Relation property value
 */
export interface RelationPropertyValue {
  readonly type: "relation";
  readonly relation: Array<{ readonly id: UUID }>;
  readonly has_more?: boolean;
}

/**
 * Rollup property value types
 */
export type RollupPropertyValue =
  | {
    readonly type: "rollup";
    readonly rollup: {
      readonly type: "number";
      readonly number: Option.Option<number>;
    };
  }
  | {
    readonly type: "rollup";
    readonly rollup: {
      readonly type: "date";
      readonly date: Option.Option<DatePropertyValue["date"]>;
    };
  }
  | {
    readonly type: "rollup";
    readonly rollup: {
      readonly type: "array";
      readonly array: Array<PropertyValue>;
    };
  };

/**
 * Title property value
 */
export interface TitlePropertyValue {
  readonly type: "title";
  readonly title: Array<RichText>;
}

/**
 * Rich text property value
 */
export interface RichTextPropertyValue {
  readonly type: "rich_text";
  readonly rich_text: Array<RichText>;
}

/**
 * People property value
 */
export interface PeoplePropertyValue {
  readonly type: "people";
  readonly people: Array<PartialUser | User>;
}

/**
 * Files property value
 */
export interface FilesPropertyValue {
  readonly type: "files";
  readonly files: Array<FileWithCaption>;
}

/**
 * Checkbox property value
 */
export interface CheckboxPropertyValue {
  readonly type: "checkbox";
  readonly checkbox: boolean;
}

/**
 * URL property value
 */
export interface URLPropertyValue {
  readonly type: "url";
  readonly url: Option.Option<string>;
}

/**
 * Email property value
 */
export interface EmailPropertyValue {
  readonly type: "email";
  readonly email: Option.Option<string>;
}

/**
 * Phone number property value
 */
export interface PhoneNumberPropertyValue {
  readonly type: "phone_number";
  readonly phone_number: Option.Option<string>;
}

/**
 * Created time property value
 */
export interface CreatedTimePropertyValue {
  readonly type: "created_time";
  readonly created_time: ISODateString;
}

/**
 * Created by property value
 */
export interface CreatedByPropertyValue {
  readonly type: "created_by";
  readonly created_by: PartialUser | User;
}

/**
 * Last edited time property value
 */
export interface LastEditedTimePropertyValue {
  readonly type: "last_edited_time";
  readonly last_edited_time: ISODateString;
}

/**
 * Last edited by property value
 */
export interface LastEditedByPropertyValue {
  readonly type: "last_edited_by";
  readonly last_edited_by: PartialUser | User;
}

/**
 * Status property value
 */
export interface StatusPropertyValue {
  readonly type: "status";
  readonly status: Option.Option<{
    readonly id: UUID;
    readonly name: string;
    readonly color: NotionColor;
  }>;
}

/**
 * Unique ID property value
 */
export interface UniqueIdPropertyValue {
  readonly type: "unique_id";
  readonly unique_id: {
    readonly number: number;
    readonly prefix: Option.Option<string>;
  };
}

/**
 * Verification property value
 */
export interface VerificationPropertyValue {
  readonly type: "verification";
  readonly verification: Option.Option<{
    readonly state: "verified" | "unverified";
    readonly verified_by: Option.Option<PartialUser | User>;
    readonly date: Option.Option<DatePropertyValue["date"]>;
  }>;
}

/**
 * Union of all property value types
 */
export type PropertyValue =
  | NumberPropertyValue
  | SelectPropertyValue
  | MultiSelectPropertyValue
  | DatePropertyValue
  | FormulaPropertyValue
  | RelationPropertyValue
  | RollupPropertyValue
  | TitlePropertyValue
  | RichTextPropertyValue
  | PeoplePropertyValue
  | FilesPropertyValue
  | CheckboxPropertyValue
  | URLPropertyValue
  | EmailPropertyValue
  | PhoneNumberPropertyValue
  | CreatedTimePropertyValue
  | CreatedByPropertyValue
  | LastEditedTimePropertyValue
  | LastEditedByPropertyValue
  | StatusPropertyValue
  | UniqueIdPropertyValue
  | VerificationPropertyValue;

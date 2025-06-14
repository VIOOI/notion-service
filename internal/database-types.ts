/**
 * @fileoverview Database and Property Schema definitions for Notion API
 * @module @notion-sdk/types/database
 */

import { Array, Effect, Either, Option, pipe, Schema } from "effect";
import type { A, B, F, L, N, O, S, U } from "ts-toolbelt";
import type {
  Icon,
  ISODateString,
  NotionColor,
  Parent,
  PartialUser,
  PropertyValue,
  RichText,
  SelectOption,
  User,
  UUID,
} from "./core-types.ts";

// ============================================================================
// Property Schema Types
// ============================================================================

/**
 * Base property schema interface
 */
export interface BasePropertySchema {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}

/**
 * Number property schema
 */
export interface NumberPropertySchema extends BasePropertySchema {
  readonly type: "number";
  readonly number: {
    readonly format:
      | "number"
      | "number_with_commas"
      | "percent"
      | "dollar"
      | "canadian_dollar"
      | "singapore_dollar"
      | "euro"
      | "pound"
      | "yen"
      | "ruble"
      | "rupee"
      | "won"
      | "yuan"
      | "real"
      | "lira"
      | "rupiah"
      | "franc"
      | "hong_kong_dollar"
      | "new_zealand_dollar"
      | "krona"
      | "norwegian_krone"
      | "mexican_peso"
      | "rand"
      | "new_taiwan_dollar"
      | "danish_krone"
      | "zloty"
      | "baht"
      | "forint"
      | "koruna"
      | "shekel"
      | "chilean_peso"
      | "philippine_peso"
      | "dirham"
      | "colombian_peso"
      | "riyal"
      | "ringgit"
      | "leu"
      | "argentine_peso"
      | "uruguayan_peso"
      | "peruvian_sol";
  };
}

/**
 * Select property schema
 */
export interface SelectPropertySchema extends BasePropertySchema {
  readonly type: "select";
  readonly select: {
    readonly options: ReadonlyArray<SelectOption>;
  };
}

/**
 * Multi-select property schema
 */
export interface MultiSelectPropertySchema extends BasePropertySchema {
  readonly type: "multi_select";
  readonly multi_select: {
    readonly options: ReadonlyArray<SelectOption>;
  };
}

/**
 * Date property schema
 */
export interface DatePropertySchema extends BasePropertySchema {
  readonly type: "date";
  readonly date: Record<string, never>; // Empty object
}

/**
 * People property schema
 */
export interface PeoplePropertySchema extends BasePropertySchema {
  readonly type: "people";
  readonly people: Record<string, never>;
}

/**
 * Files property schema
 */
export interface FilesPropertySchema extends BasePropertySchema {
  readonly type: "files";
  readonly files: Record<string, never>;
}

/**
 * Checkbox property schema
 */
export interface CheckboxPropertySchema extends BasePropertySchema {
  readonly type: "checkbox";
  readonly checkbox: Record<string, never>;
}

/**
 * URL property schema
 */
export interface URLPropertySchema extends BasePropertySchema {
  readonly type: "url";
  readonly url: Record<string, never>;
}

/**
 * Email property schema
 */
export interface EmailPropertySchema extends BasePropertySchema {
  readonly type: "email";
  readonly email: Record<string, never>;
}

/**
 * Phone number property schema
 */
export interface PhoneNumberPropertySchema extends BasePropertySchema {
  readonly type: "phone_number";
  readonly phone_number: Record<string, never>;
}

/**
 * Formula property schema
 */
export interface FormulaPropertySchema extends BasePropertySchema {
  readonly type: "formula";
  readonly formula: {
    readonly expression: string;
  };
}

/**
 * Relation property schema
 */
export interface RelationPropertySchema extends BasePropertySchema {
  readonly type: "relation";
  readonly relation: {
    readonly database_id: UUID;
    readonly type: "single_property" | "dual_property";
    readonly single_property?: Record<string, never>;
    readonly dual_property?: {
      readonly synced_property_id: string;
      readonly synced_property_name: string;
    };
  };
}

/**
 * Rollup function types
 */
export const RollupFunction = {
  COUNT_ALL: "count_all",
  COUNT_VALUES: "count_values",
  COUNT_UNIQUE_VALUES: "count_unique_values",
  COUNT_EMPTY: "count_empty",
  COUNT_NOT_EMPTY: "count_not_empty",
  PERCENT_EMPTY: "percent_empty",
  PERCENT_NOT_EMPTY: "percent_not_empty",
  SUM: "sum",
  AVERAGE: "average",
  MEDIAN: "median",
  MIN: "min",
  MAX: "max",
  RANGE: "range",
  SHOW_ORIGINAL: "show_original",
} as const;

export type RollupFunction =
  (typeof RollupFunction)[keyof typeof RollupFunction];

/**
 * Rollup property schema
 */
export interface RollupPropertySchema extends BasePropertySchema {
  readonly type: "rollup";
  readonly rollup: {
    readonly relation_property_name: string;
    readonly relation_property_id: string;
    readonly rollup_property_name: string;
    readonly rollup_property_id: string;
    readonly function: RollupFunction;
  };
}

/**
 * Title property schema
 */
export interface TitlePropertySchema extends BasePropertySchema {
  readonly type: "title";
  readonly title: Record<string, never>;
}

/**
 * Rich text property schema
 */
export interface RichTextPropertySchema extends BasePropertySchema {
  readonly type: "rich_text";
  readonly rich_text: Record<string, never>;
}

/**
 * Created time property schema
 */
export interface CreatedTimePropertySchema extends BasePropertySchema {
  readonly type: "created_time";
  readonly created_time: Record<string, never>;
}

/**
 * Created by property schema
 */
export interface CreatedByPropertySchema extends BasePropertySchema {
  readonly type: "created_by";
  readonly created_by: Record<string, never>;
}

/**
 * Last edited time property schema
 */
export interface LastEditedTimePropertySchema extends BasePropertySchema {
  readonly type: "last_edited_time";
  readonly last_edited_time: Record<string, never>;
}

/**
 * Last edited by property schema
 */
export interface LastEditedByPropertySchema extends BasePropertySchema {
  readonly type: "last_edited_by";
  readonly last_edited_by: Record<string, never>;
}

/**
 * Status group
 */
export interface StatusGroup {
  readonly id: UUID;
  readonly name: string;
  readonly color: NotionColor;
  readonly option_ids: ReadonlyArray<UUID>;
}

/**
 * Status property schema
 */
export interface StatusPropertySchema extends BasePropertySchema {
  readonly type: "status";
  readonly status: {
    readonly options: ReadonlyArray<SelectOption>;
    readonly groups: ReadonlyArray<StatusGroup>;
  };
}

/**
 * Unique ID property schema
 */
export interface UniqueIdPropertySchema extends BasePropertySchema {
  readonly type: "unique_id";
  readonly unique_id: {
    readonly prefix: Option.Option<string>;
  };
}

/**
 * Verification property schema
 */
export interface VerificationPropertySchema extends BasePropertySchema {
  readonly type: "verification";
  readonly verification: Record<string, never>;
}

/**
 * Union of all property schema types
 */
export type PropertySchema =
  | NumberPropertySchema
  | SelectPropertySchema
  | MultiSelectPropertySchema
  | DatePropertySchema
  | PeoplePropertySchema
  | FilesPropertySchema
  | CheckboxPropertySchema
  | URLPropertySchema
  | EmailPropertySchema
  | PhoneNumberPropertySchema
  | FormulaPropertySchema
  | RelationPropertySchema
  | RollupPropertySchema
  | TitlePropertySchema
  | RichTextPropertySchema
  | CreatedTimePropertySchema
  | CreatedByPropertySchema
  | LastEditedTimePropertySchema
  | LastEditedByPropertySchema
  | StatusPropertySchema
  | UniqueIdPropertySchema
  | VerificationPropertySchema;

/**
 * Database properties schema map
 */
export type DatabaseProperties = {
  readonly [key: string]: PropertySchema;
};

// ============================================================================
// Database Types
// ============================================================================

/**
 * Database object interface
 */
export interface Database {
  readonly object: "database";
  readonly id: UUID;
  readonly created_time: ISODateString;
  readonly created_by: PartialUser;
  readonly last_edited_time: ISODateString;
  readonly last_edited_by: PartialUser;
  readonly title: ReadonlyArray<RichText>;
  readonly description: ReadonlyArray<RichText>;
  readonly icon: Option.Option<Icon>;
  readonly cover: Option.Option<File>;
  readonly properties: DatabaseProperties;
  readonly parent: Parent;
  readonly url: string;
  readonly archived: boolean;
  readonly is_inline: boolean;
  readonly public_url: Option.Option<string>;
}

/**
 * Partial database object (used in search results)
 */
export interface PartialDatabase extends
  Pick<
    Database,
    | "object"
    | "id"
    | "created_time"
    | "last_edited_time"
    | "title"
    | "description"
    | "icon"
    | "cover"
    | "parent"
    | "url"
    | "archived"
    | "is_inline"
    | "public_url"
  > {}

// ============================================================================
// Page Types
// ============================================================================

/**
 * Page property values map
 */
export type PageProperties = {
  readonly [key: string]: PropertyValue;
};

/**
 * Page object interface
 */
export interface Page {
  readonly object: "page";
  readonly id: UUID;
  readonly created_time: ISODateString;
  readonly created_by: PartialUser;
  readonly last_edited_time: ISODateString;
  readonly last_edited_by: PartialUser;
  readonly archived: boolean;
  readonly icon: Option.Option<Icon>;
  readonly cover: Option.Option<File>;
  readonly properties: PageProperties;
  readonly parent: Parent;
  readonly url: string;
  readonly public_url: Option.Option<string>;
}

export const sPage = Schema.Struct({
  object: Schema.Literal("page"),
  id: Schema.String,
  created_time: Schema.String,
  created_by: Schema.Unknown,
  last_edited_time: Schema.String,
  last_edited_by: Schema.Unknown,
  archived: Schema.Boolean,
  icon: Schema.Unknown,
  cover: Schema.Unknown,
  properties: Schema.Unknown,
  parent: Schema.Unknown,
  url: Schema.String,
  public_url: Schema.Unknown,
});

/**
 * Partial page object (used in search results)
 */
export interface PartialPage extends
  Pick<
    Page,
    | "object"
    | "id"
    | "created_time"
    | "last_edited_time"
    | "archived"
    | "icon"
    | "cover"
    | "parent"
    | "url"
    | "public_url"
  > {
  readonly properties: PageProperties;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Text filter conditions
 */
export interface TextFilter {
  readonly equals?: string;
  readonly does_not_equal?: string;
  readonly contains?: string;
  readonly does_not_contain?: string;
  readonly starts_with?: string;
  readonly ends_with?: string;
  readonly is_empty?: true;
  readonly is_not_empty?: true;
}

/**
 * Number filter conditions
 */
export interface NumberFilter {
  readonly equals?: number;
  readonly does_not_equal?: number;
  readonly greater_than?: number;
  readonly less_than?: number;
  readonly greater_than_or_equal_to?: number;
  readonly less_than_or_equal_to?: number;
  readonly is_empty?: true;
  readonly is_not_empty?: true;
}

/**
 * Checkbox filter conditions
 */
export interface CheckboxFilter {
  readonly equals?: boolean;
  readonly does_not_equal?: boolean;
}

/**
 * Select filter conditions
 */
export interface SelectFilter {
  readonly equals?: string;
  readonly does_not_equal?: string;
  readonly is_empty?: true;
  readonly is_not_empty?: true;
}

/**
 * Multi-select filter conditions
 */
export interface MultiSelectFilter {
  readonly contains?: string;
  readonly does_not_contain?: string;
  readonly is_empty?: true;
  readonly is_not_empty?: true;
}

/**
 * Date filter conditions
 */
export interface DateFilter {
  readonly equals?: string;
  readonly before?: string;
  readonly after?: string;
  readonly on_or_before?: string;
  readonly on_or_after?: string;
  readonly past_week?: Record<string, never>;
  readonly past_month?: Record<string, never>;
  readonly past_year?: Record<string, never>;
  readonly next_week?: Record<string, never>;
  readonly next_month?: Record<string, never>;
  readonly next_year?: Record<string, never>;
  readonly is_empty?: true;
  readonly is_not_empty?: true;
}

/**
 * People filter conditions
 */
export interface PeopleFilter {
  readonly contains?: UUID;
  readonly does_not_contain?: UUID;
  readonly is_empty?: true;
  readonly is_not_empty?: true;
}

/**
 * Files filter conditions
 */
export interface FilesFilter {
  readonly is_empty?: true;
  readonly is_not_empty?: true;
}

/**
 * Relation filter conditions
 */
export interface RelationFilter {
  readonly contains?: UUID;
  readonly does_not_contain?: UUID;
  readonly is_empty?: true;
  readonly is_not_empty?: true;
}

/**
 * Formula filter conditions
 */
export interface FormulaFilter {
  readonly string?: TextFilter;
  readonly checkbox?: CheckboxFilter;
  readonly number?: NumberFilter;
  readonly date?: DateFilter;
}

/**
 * Rollup filter conditions
 */
export interface RollupFilter {
  readonly any?: PropertyFilter;
  readonly none?: PropertyFilter;
  readonly every?: PropertyFilter;
  readonly date?: DateFilter;
  readonly number?: NumberFilter;
}

/**
 * Property filter types
 */
export type PropertyFilter =
  & {
    readonly property: string;
    readonly type?: string;
  }
  & (
    | { readonly title: TextFilter }
    | { readonly rich_text: TextFilter }
    | { readonly number: NumberFilter }
    | { readonly checkbox: CheckboxFilter }
    | { readonly select: SelectFilter }
    | { readonly multi_select: MultiSelectFilter }
    | { readonly date: DateFilter }
    | { readonly people: PeopleFilter }
    | { readonly files: FilesFilter }
    | { readonly url: TextFilter }
    | { readonly email: TextFilter }
    | { readonly phone_number: TextFilter }
    | { readonly relation: RelationFilter }
    | { readonly created_by: PeopleFilter }
    | { readonly created_time: DateFilter }
    | { readonly last_edited_by: PeopleFilter }
    | { readonly last_edited_time: DateFilter }
    | { readonly formula: FormulaFilter }
    | { readonly rollup: RollupFilter }
    | { readonly status: SelectFilter }
    | { readonly unique_id: NumberFilter }
    | {
      readonly verification: {
        readonly state?: "verified" | "unverified";
        readonly date?: DateFilter;
        readonly verified_by?: PeopleFilter;
      };
    }
  );

/**
 * Timestamp filter types
 */
export type TimestampFilter =
  | { readonly timestamp: "created_time"; readonly created_time: DateFilter }
  | {
    readonly timestamp: "last_edited_time";
    readonly last_edited_time: DateFilter;
  };

/**
 * Compound filter
 */
export interface CompoundFilter {
  readonly or?: ReadonlyArray<
    PropertyFilter | CompoundFilter | TimestampFilter
  >;
  readonly and?: ReadonlyArray<
    PropertyFilter | CompoundFilter | TimestampFilter
  >;
}

/**
 * Database query filter
 */
export type Filter = PropertyFilter | TimestampFilter | CompoundFilter;

// ============================================================================
// Sort Types
// ============================================================================

/**
 * Sort direction
 */
export const SortDirection = {
  ASCENDING: "ascending",
  DESCENDING: "descending",
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

/**
 * Property sort
 */
export interface PropertySort {
  readonly property: string;
  readonly direction: SortDirection;
}

/**
 * Timestamp sort
 */
export interface TimestampSort {
  readonly timestamp: "created_time" | "last_edited_time";
  readonly direction: SortDirection;
}

/**
 * Sort type
 */
export type Sort = PropertySort | TimestampSort;

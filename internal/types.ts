/**
 * @fileoverview API operations, responses and Effect-based SDK for Notion API
 * @module @notion-sdk/types/operations
 */

import { Array, Effect, Option, pipe, Schema } from "effect";
import type {
  Icon,
  ISODateString,
  NotionObjectType,
  Parent,
  PartialUser,
  RichText,
  User,
  UUID,
} from "./core-types.ts";
import type {
  CompoundFilter,
  Database,
  DatabaseProperties,
  Filter,
  Page,
  PageProperties,
  PartialDatabase,
  PartialPage,
  PropertyFilter,
  Sort,
} from "./database-types.ts";
import type {
  Block,
  BlockCreateRequest,
  BlockType,
  BlockUpdateRequest,
} from "./block-types.ts";

// ============================================================================
// API Error Types
// ============================================================================

/**
 * Notion API error codes
 */
export const NotionErrorCode = {
  INVALID_JSON: "invalid_json",
  INVALID_REQUEST_URL: "invalid_request_url",
  INVALID_REQUEST: "invalid_request",
  VALIDATION_ERROR: "validation_error",
  MISSING_VERSION: "missing_version",
  UNAUTHORIZED: "unauthorized",
  RESTRICTED_RESOURCE: "restricted_resource",
  OBJECT_NOT_FOUND: "object_not_found",
  CONFLICT_ERROR: "conflict_error",
  RATE_LIMITED: "rate_limited",
  INTERNAL_SERVER_ERROR: "internal_server_error",
  SERVICE_UNAVAILABLE: "service_unavailable",
  DATABASE_CONNECTION_UNAVAILABLE: "database_connection_unavailable",
  GATEWAY_TIMEOUT: "gateway_timeout",
} as const;

export type NotionErrorCode =
  (typeof NotionErrorCode)[keyof typeof NotionErrorCode];

/**
 * Notion API error response
 */
export interface NotionAPIError {
  readonly object: "error";
  readonly status: number;
  readonly code: NotionErrorCode;
  readonly message: string;
  readonly request_id?: string;
}

/**
 * Custom error class for Notion API errors using Effect
 */
export class NotionError extends Schema.TaggedError<NotionError>()(
  "NotionError",
  {
    status: Schema.Number,
    code: Schema.Literal(...Object.values(NotionErrorCode)),
    message: Schema.String,
    requestId: Schema.optional(Schema.String),
  },
) {}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  readonly start_cursor?: string;
  // readonly page_size?: N.Range<"1", "100">;
  readonly page_size?: number;
}

/**
 * List response with pagination
 */
export interface PaginatedList<T> {
  readonly object: "list";
  readonly results: Array<T>;
  readonly next_cursor: Option.Option<string>;
  readonly has_more: boolean;
  readonly type?: NotionObjectType;
  readonly page_or_database?: Record<string, never>;
  readonly request_id?: string;
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * Search filter types
 */
export const SearchFilterType = {
  PAGE: "page",
  DATABASE: "database",
} as const;

export type SearchFilterType =
  (typeof SearchFilterType)[keyof typeof SearchFilterType];

/**
 * Search sort options
 */
export const SearchSort = {
  RELEVANCE: "relevance",
  LAST_EDITED_TIME: "last_edited_time",
} as const;

export type SearchSort = (typeof SearchSort)[keyof typeof SearchSort];

/**
 * Search parameters
 */
export interface SearchParams extends PaginationParams {
  readonly query?: string;
  readonly filter?: {
    readonly value: SearchFilterType;
    readonly property: "object";
  };
  readonly sort?: {
    readonly direction: "ascending" | "descending";
    readonly timestamp: SearchSort;
  };
}

// ============================================================================
// Database Operation Types
// ============================================================================

/**
 * Create database request
 */
export interface CreateDatabaseRequest {
  readonly parent: Parent;
  readonly title: Array<RichText>;
  readonly description?: Array<RichText>;
  readonly icon?: Icon;
  readonly cover?: File;
  readonly properties: DatabaseProperties;
  readonly is_inline?: boolean;
}

/**
 * Update database request
 */
export interface UpdateDatabaseRequest {
  readonly title?: Array<RichText>;
  readonly description?: Array<RichText>;
  readonly icon?: Icon | null;
  readonly cover?: File | null;
  readonly properties?: DatabaseProperties;
  readonly archived?: boolean;
}

/**
 * Query database request
 */
export interface QueryDatabaseRequest extends PaginationParams {
  readonly filter?: Filter;
  readonly sorts?: Array<Sort>;
}

// ============================================================================
// Page Operation Types
// ============================================================================

/**
 * Create page request
 */
export interface CreatePageRequest {
  readonly parent: Parent;
  readonly properties: PageProperties;
  readonly icon?: Icon;
  readonly cover?: File;
  readonly children?: Array<BlockCreateRequest>;
}

/**
 * Update page request
 */
export interface UpdatePageRequest {
  readonly properties?: PageProperties;
  readonly icon?: Icon | null;
  readonly cover?: File | null;
  readonly archived?: boolean;
}

// ============================================================================
// Block Operation Types
// ============================================================================

/**
 * Append block children request
 */
export interface AppendBlockChildrenRequest {
  readonly children: Array<BlockCreateRequest>;
  readonly after?: UUID;
}

/**
 * Delete block is just archiving it
 */
export interface DeleteBlockRequest {
  readonly archived: true;
}

// ============================================================================
// User Operation Types
// ============================================================================

/**
 * User list parameters
 */
export interface ListUsersParams extends PaginationParams {}

// ============================================================================
// Comment Operation Types
// ============================================================================

/**
 * Comment object
 */
export interface Comment {
  readonly object: "comment";
  readonly id: UUID;
  readonly parent: {
    readonly type: "page_id" | "block_id";
    readonly page_id?: UUID;
    readonly block_id?: UUID;
  };
  readonly discussion_id: UUID;
  readonly created_time: ISODateString;
  readonly last_edited_time: ISODateString;
  readonly created_by: PartialUser;
  readonly rich_text: Array<RichText>;
}

/**
 * Create comment request
 */
export interface CreateCommentRequest {
  readonly parent: {
    readonly page_id?: UUID;
    readonly block_id?: UUID;
  };
  readonly discussion_id?: UUID;
  readonly rich_text: Array<RichText>;
}

// ============================================================================
// Effect-based API Client Interface
// ============================================================================

/**
 * Configuration for the Notion API client
 */
export interface NotionClientConfig {
  readonly auth: string;
  readonly notionVersion?: string;
  readonly baseURL?: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

/**
 * Schema for validating client configuration
 */
export const NotionClientConfigSchema = Schema.Struct({
  auth: Schema.String,
  notionVersion: Schema.optional(Schema.String),
  baseURL: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number),
  fetch: Schema.optional(Schema.Unknown),
});

/**
 * HTTP methods
 */
export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

/**
 * Request options for API calls
 */
export interface RequestOptions<T = unknown> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: T;
  readonly query?: Record<string, string | number | boolean>;
}

/**
 * Effect-based HTTP client service
 */
export interface HttpClient {
  readonly request: <T, E = NotionError>(
    options: RequestOptions,
  ) => Effect.Effect<T, E>;
}

/**
 * Effect-based Notion API client service interface
 */
export interface NotionClient {
  // Database operations
  readonly databases: {
    readonly retrieve: (id: UUID) => Effect.Effect<Database, NotionError>;
    readonly create: (
      request: CreateDatabaseRequest,
    ) => Effect.Effect<Database, NotionError>;
    readonly update: (
      id: UUID,
      request: UpdateDatabaseRequest,
    ) => Effect.Effect<Database, NotionError>;
    readonly query: (
      id: UUID,
      request?: QueryDatabaseRequest,
    ) => Effect.Effect<PaginatedList<Page>, NotionError>;
  };

  // Page operations
  readonly pages: {
    readonly retrieve: (id: UUID) => Effect.Effect<Page, NotionError>;
    readonly create: (
      request: CreatePageRequest,
    ) => Effect.Effect<Page, NotionError>;
    readonly update: (
      id: UUID,
      request: UpdatePageRequest,
    ) => Effect.Effect<Page, NotionError>;
  };

  // Block operations
  readonly blocks: {
    readonly retrieve: (id: UUID) => Effect.Effect<Block, NotionError>;
    readonly update: (
      id: UUID,
      request: BlockUpdateRequest,
    ) => Effect.Effect<Block, NotionError>;
    readonly delete: (id: UUID) => Effect.Effect<Block, NotionError>;
    readonly children: {
      readonly list: (
        id: UUID,
        params?: PaginationParams,
      ) => Effect.Effect<PaginatedList<Block>, NotionError>;
      readonly append: (
        id: UUID,
        request: AppendBlockChildrenRequest,
      ) => Effect.Effect<PaginatedList<Block>, NotionError>;
    };
  };

  // User operations
  readonly users: {
    readonly retrieve: (id: UUID) => Effect.Effect<User, NotionError>;
    readonly list: (
      params?: ListUsersParams,
    ) => Effect.Effect<PaginatedList<User>, NotionError>;
    readonly me: () => Effect.Effect<User, NotionError>;
  };

  // Search operation
  readonly search: (
    params?: SearchParams,
  ) => Effect.Effect<PaginatedList<Page | Database>, NotionError>;

  // Comment operations
  readonly comments: {
    readonly create: (
      request: CreateCommentRequest,
    ) => Effect.Effect<Comment, NotionError>;
    readonly list: (
      params: { block_id?: UUID; page_id?: UUID } & PaginationParams,
    ) => Effect.Effect<PaginatedList<Comment>, NotionError>;
  };
}

// ============================================================================
// Functional Helpers and Utilities
// ============================================================================

/**
 * Type guard for checking if object is a database
 */
export const isDatabase = (obj: { object: string }): obj is
  | Database
  | PartialDatabase => obj.object === "database";

/**
 * Type guard for checking if object is a page
 */
export const isPage = (obj: { object: string }): obj is Page | PartialPage =>
  obj.object === "page";

/**
 * Type guard for checking if object is a block
 */
export const isBlock = (obj: { object: string }): obj is Block =>
  obj.object === "block";

/**
 * Type guard for specific block types
 */
export const isBlockType = <T extends BlockType>(
  block: Block,
  type: T,
): block is Extract<Block, { type: T }> => block.type === type;

/**
 * Extract plain text from rich text array
 * @pure
 */
export const extractPlainText = (richText: Array<RichText>): string =>
  pipe(
    richText,
    Array.map((rt) => rt.plain_text),
    Array.join(""),
  );

/**
 * Create a filter builder using Effect
 */
export const filterBuilder = {
  /**
   * Create a property filter
   */
  property: <T extends keyof PropertyFilter>(
    property: string,
    type: T,
    condition: PropertyFilter[T],
  ): PropertyFilter =>
    ({
      property,
      [type]: condition,
    }) as any as PropertyFilter,

  /**
   * Combine filters with AND
   */
  and: (...filters: Array<Filter>): CompoundFilter => ({
    and: filters,
  }),

  /**
   * Combine filters with OR
   */
  or: (...filters: Array<Filter>): CompoundFilter => ({
    or: filters,
  }),
};

/**
 * Pagination helper to fetch all results
 */
export const fetchAllPages = <T>(
  fetchPage: (cursor?: string) => Effect.Effect<PaginatedList<T>, NotionError>,
): Effect.Effect<Array<T>, NotionError> => {
  const fetchRecursive = (
    cursor?: string,
    accumulated: Array<T> = Array.empty(),
  ): Effect.Effect<Array<T>, NotionError> =>
    pipe(
      fetchPage(cursor),
      Effect.flatMap((response) => {
        const newAccumulated = Array.appendAll(accumulated, response.results);

        return response.has_more && Option.isSome(response.next_cursor)
          ? fetchRecursive(
            Option.getOrNull(response.next_cursor) as string | undefined,
            newAccumulated,
          )
          : Effect.succeed(newAccumulated);
      }),
    );

  return fetchRecursive();
};

/**
 * Retry configuration for API calls
 */
export const defaultRetryPolicy = {
  times: 3,
  delay: "exponential" as const,
  factor: 2,
  maxDelay: 10000,
  jitter: true,
};

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  readonly requestsPerSecond: number;
  readonly burst: number;
}

/**
 * Default rate limiter config (3 requests per second as per Notion API limits)
 */
export const defaultRateLimiterConfig: RateLimiterConfig = {
  requestsPerSecond: 3,
  burst: 10,
} as const;

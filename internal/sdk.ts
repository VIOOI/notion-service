// deno-lint-ignore-file no-explicit-any
/**
 * @fileoverview Production-ready Notion SDK implementation using Effect-ts
 * @module @notion-sdk/client
 */

import { Config, Context, Duration, Effect, Layer, pipe, Schedule, TSemaphore } from "effect";

// Import all types from previous modules
import {
  AppendBlockChildrenRequest,
  Comment,
  CreateCommentRequest,
  CreateDatabaseRequest,
  CreatePageRequest,
  HttpClient,
  ListUsersParams,
  NotionClient,
  NotionClientConfig,
  NotionError,
  PaginatedList,
  PaginationParams,
  QueryDatabaseRequest,
  RequestOptions,
  SearchParams,
  UpdateDatabaseRequest,
  UpdatePageRequest,
} from "./types.ts";
import { Database, Page } from "./database-types.ts";
import { Block, BlockUpdateRequest } from "./block-types.ts";
import { User, UUID } from "./core-types.ts";

// ============================================================================
// Service Tags
// ============================================================================

/**
 * Service tag for HttpClient
 */
export class HttpClientService extends Context.Tag("HttpClient")<
  HttpClientService,
  HttpClient
>() {}

/**
 * Service tag for NotionClient
 */
export class NotionClientService extends Context.Tag("NotionClient")<
  NotionClientService,
  NotionClient
>() {}

/**
 * Service tag for RateLimiter
 */
export class RateLimiterService extends Context.Tag("RateLimiter")<
  RateLimiterService,
  {
    acquire: Effect.Effect<void>;
  }
>() {}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration service using Effect Config
 */
export const NotionConfigService = {
  auth: Config.string("NOTION_AUTH_TOKEN"),
  notionVersion: Config.string("NOTION_VERSION").pipe(
    Config.withDefault("2022-06-28"),
  ),
  baseURL: Config.string("NOTION_BASE_URL").pipe(
    Config.withDefault("https://api.notion.com/v1"),
  ),
  timeoutMs: Config.integer("NOTION_TIMEOUT_MS").pipe(
    Config.withDefault(30000),
  ),
  rateLimitPerSecond: Config.integer("NOTION_RATE_LIMIT_PER_SECOND").pipe(
    Config.withDefault(3),
  ),
};

// ============================================================================
// Rate Limiter Implementation
// ============================================================================

/**
 * Token bucket rate limiter implementation
 */
export const createRateLimiter = (
  requestsPerSecond: number,
  burst: number = 10,
): Effect.Effect<RateLimiterService, never, never> =>
  Effect.gen(function* () {
    const semaphore = yield* TSemaphore.make(burst);
    const refillInterval = 1000 / requestsPerSecond;

    // Start refill process
    yield* Effect.forkDaemon(
      Effect.forever(
        Effect.gen(function* () {
          yield* Effect.sleep(Duration.millis(refillInterval));
          yield* TSemaphore.releaseN(semaphore, 1);
        }),
      ),
    );

    return RateLimiterService.of({
      acquire: TSemaphore.withPermit(semaphore)(Effect.void),
    }) as any as RateLimiterService;
  }).pipe((h) => h);

// ============================================================================
// HTTP Client Implementation
// ============================================================================

/**
 * Create HTTP client with rate limiting and retry logic
 */
export const createHttpClient = (
  config: NotionClientConfig,
): Effect.Effect<HttpClient, never, RateLimiterService> =>
  Effect.gen(function* () {
    const rateLimiter = yield* RateLimiterService;

    /**
     * Build request headers
     */
    const buildHeaders = (contentType?: string): Headers => {
      const headers = new Headers({
        Authorization: `Bearer ${config.auth}`,
        "Notion-Version": config.notionVersion || "2022-06-28",
        // "User-Agent": "@notion-sdk/client/1.0.0",
      });

      if (contentType) {
        headers.set("Content-Type", contentType);
      }

      return headers;
    };

    /**
     * Build URL with query parameters
     */
    const buildURL = (
      path: string,
      query?: Record<string, string | number | boolean>,
    ): string => {
      const baseURL = config.baseURL || "https://api.notion.com/v1";

      const url = new URL(path, baseURL);

      // console.log(url.toString(), baseURL);

      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
          }
        });
      }

      return url.toString();
    };

    /**
     * Parse API response
     */
    const parseResponse = <T>(
      response: Response,
    ): Effect.Effect<T, NotionError> =>
      Effect.gen(function* () {
        const text = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: () =>
            new NotionError({
              status: 0,
              code: "internal_server_error",
              message: "Failed to read response body",
            }),
        });

        if (!response.ok) {
          try {
            const error = JSON.parse(text);
            yield* Effect.fail(
              new NotionError({
                status: response.status,
                code: error.code,
                message: error.message,
                requestId: error.request_id,
              }),
            );
          } catch {
            yield* Effect.fail(
              new NotionError({
                status: response.status,
                code: "internal_server_error",
                message: text || response.statusText,
              }),
            );
          }
        }

        try {
          return JSON.parse(text) as T;
        } catch {
          yield* Effect.fail(
            new NotionError({
              status: response.status,
              code: "invalid_json",
              message: "Invalid JSON response",
            }),
          );
        }
      }) as any as Effect.Effect<T, NotionError>;

    /**
     * Execute HTTP request with retry and rate limiting
     */
    const request = <T>(
      options: RequestOptions,
    ): Effect.Effect<T, NotionError> =>
      pipe(
        Effect.Do,
        Effect.tap(() => rateLimiter.acquire),
        Effect.flatMap(() =>
          Effect.gen(function* () {
            const url = buildURL(options.path, options.query);
            // console.log(url, options.path, options.query);

            const fetchFn = config.fetch || fetch;

            const init: RequestInit = {
              method: options.method,
              headers: buildHeaders(
                options.body ? "application/json" : undefined,
              ),
              signal: AbortSignal.timeout(config.timeoutMs || 30000),
            };

            if (options.body) {
              init.body = JSON.stringify(options.body);
            }

            const response = yield* Effect.tryPromise({
              try: () => fetchFn(url, init),
              catch: (error) =>
                new NotionError({
                  status: 0,
                  code: "internal_server_error",
                  message: error instanceof Error ? error.message : "Network error",
                }),
            });

            return yield* parseResponse<T>(response);
          })
        ),
        Effect.retry({
          times: 3,
          schedule: Schedule.exponential(Duration.seconds(1)),
          while: (error) =>
            error.code === "rate_limited" ||
            error.code === "internal_server_error" ||
            error.code === "service_unavailable" ||
            error.code === "gateway_timeout",
        }),
      );

    return { request } as any as HttpClient;
  });

// ============================================================================
// Notion Client Implementation
// ============================================================================

/**
 * Create the main Notion client
 */
export const createNotionClient = (): Effect.Effect<
  NotionClient,
  never,
  HttpClientService
> =>
  Effect.gen(function* () {
    const http = yield* HttpClientService;
    // const safeHttp = yield* safeCreateHttpClient();
    //
    // safeHttp.get(`databases/${id}`);

    /**
     * Database operations
     */
    const databases = {
      retrieve: (id: UUID) =>
        http.request<Database>({
          method: "GET",
          path: `/v1/databases/${id}`,
        }),

      create: (request: CreateDatabaseRequest) =>
        http.request<Database>({
          method: "POST",
          path: "/v1/databases",
          body: request,
        }),

      update: (id: UUID, request: UpdateDatabaseRequest) =>
        http.request<Database>({
          method: "PATCH",
          path: `/v1/databases/${id}`,
          body: request,
        }),

      query: (id: UUID, request?: QueryDatabaseRequest) =>
        http.request<PaginatedList<Page>>({
          method: "POST",
          path: `/v1/databases/${id}/query`,
          body: request || {},
        }),
    };

    /**
     * Page operations
     */
    const pages = {
      retrieve: (id: UUID) =>
        http.request<Page>({
          method: "GET",
          path: `/v1/pages/${id}`,
        }),

      create: (request: CreatePageRequest) =>
        http.request<Page>({
          method: "POST",
          path: "/v1/pages",
          body: request,
        }),

      update: (id: UUID, request: UpdatePageRequest) =>
        http.request<Page>({
          method: "PATCH",
          path: `/v1/pages/${id}`,
          body: request,
        }),
    };

    /**
     * Block operations
     */
    const blocks = {
      retrieve: (id: UUID) =>
        http.request<Block>({
          method: "GET",
          path: `/v1/blocks/${id}`,
        }),

      update: (id: UUID, request: BlockUpdateRequest) =>
        http.request<Block>({
          method: "PATCH",
          path: `/v1/blocks/${id}`,
          body: request,
        }),

      delete: (id: UUID) =>
        http.request<Block>({
          method: "DELETE",
          path: `/v1/blocks/${id}`,
        }),

      children: {
        list: (id: UUID, params?: PaginationParams) =>
          http.request<PaginatedList<Block>>({
            method: "GET",
            path: `/v1/blocks/${id}/children`,
            query: params as any,
          }),

        append: (id: UUID, request: AppendBlockChildrenRequest) =>
          http.request<PaginatedList<Block>>({
            method: "PATCH",
            path: `/v1/blocks/${id}/children`,
            body: request,
          }),
      },
    };

    /**
     * User operations
     */
    const users = {
      retrieve: (id: UUID) =>
        http.request<User>({
          method: "GET",
          path: `/v1/users/${id}`,
        }),

      list: (params?: ListUsersParams) =>
        http.request<PaginatedList<User>>({
          method: "GET",
          path: "/v1/users",
          query: params as any,
        }),

      me: () =>
        http.request<User>({
          method: "GET",
          path: "/v1/users/me",
        }),
    };

    /**
     * Search operation
     */
    const search = (params?: SearchParams) =>
      http.request<PaginatedList<Page | Database>>({
        method: "POST",
        path: "/v1/search",
        body: params || {},
      });

    /**
     * Comment operations
     */
    const comments = {
      create: (request: CreateCommentRequest) =>
        http.request<Comment>({
          method: "POST",
          path: "/v1/comments",
          body: request,
        }),

      list: (params: { block_id?: UUID; page_id?: UUID } & PaginationParams) =>
        http.request<PaginatedList<Comment>>({
          method: "GET",
          path: "/v1/comments",
          query: params as any,
        }),
    };

    return {
      databases,
      pages,
      blocks,
      users,
      search,
      comments,
    };
  });

// ============================================================================
// Layer Composition
// ============================================================================

/**
 * Create a complete Notion client layer
 */
export const NotionClientLayer = (
  config: NotionClientConfig,
): Layer.Layer<NotionClientService> =>
  Layer.effect(NotionClientService, createNotionClient()).pipe(
    Layer.provide(Layer.effect(HttpClientService, createHttpClient(config))),
    Layer.provide(
      // Layer.effect(RateLimiterService.of, createRateLimiter(3, 10) as any),
      Layer.effect(
        RateLimiterService,
        Effect.gen(function* () {
          const tmp = yield* createRateLimiter(3, 10);
          return tmp as any as { acquire: Effect.Effect<void, never, never> };
        }),
      ),
    ),
  );

// ============================================================================
// Usage Examples
// ============================================================================

Effect.gen(function* () {
  const client = yield* NotionClientService;
}).pipe(
  Effect.provide(
    NotionClientLayer({
      auth: "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",
    }),
  ),
);

/**
 * Example 1: Create a database with validation
 * @example
 * ```typescript
 * const createProductDatabase = Effect.gen(function* () {
 *   const client = yield* NotionClientService
 *
 *   const database = yield* client.databases.create({
 *     parent: { type: "workspace", workspace: true },
 *     title: [{ type: "text", text: { content: "Products" } }],
 *     properties: {
 *       Name: {
 *         id: "title",
 *         name: "Name",
 *         type: "title",
 *         title: {}
 *       },
 *       Price: {
 *         id: "price",
 *         name: "Price",
 *         type: "number",
 *         number: { format: "dollar" }
 *       },
 *       InStock: {
 *         id: "in_stock",
 *         name: "In Stock",
 *         type: "checkbox",
 *         checkbox: {}
 *       }
 *     }
 *   })
 *
 *   return database
 * })
 * ```
 */

/**
 * Example 2: Query database with complex filters
 * @example
 * ```typescript
 * import { filterBuilder } from "./operations"
 *
 * const queryProducts = (minPrice: number) => Effect.gen(function* () {
 *   const client = yield* NotionClientService
 *
 *   const filter = filterBuilder.and(
 *     filterBuilder.property("Price", "number", {
 *       greater_than_or_equal_to: minPrice
 *     }),
 *     filterBuilder.property("InStock", "checkbox", {
 *       equals: true
 *     })
 *   )
 *
 *   const results = yield* client.databases.query(databaseId, {
 *     filter,
 *     sorts: [{ property: "Price", direction: "ascending" }],
 *     page_size: 50
 *   })
 *
 *   return results
 * })
 * ```
 */

/**
 * Example 3: Batch operations with concurrency control
 * @example
 * ```typescript
 * import { fetchAllPages } from "./operations"
 *
 * const processAllPages = Effect.gen(function* () {
 *   const client = yield* NotionClientService
 *
 *   // Fetch all pages with automatic pagination
 *   const allPages = yield* fetchAllPages(
 *     (cursor) => client.databases.query(databaseId, {
 *       start_cursor: cursor,
 *       page_size: 100
 *     })
 *   )
 *
 *   // Process pages with controlled concurrency
 *   const results = yield* Effect.forEach(
 *     allPages,
 *     (page) => processPage(page),
 *     { concurrency: 5 }
 *   )
 *
 *   return results
 * })
 * ```
 */

/**
 * Example 4: Running the client
 * @example
 * ```typescript
 * // Create runtime with configuration
 * const runtime = Runtime.defaultRuntime.pipe(
 *   Runtime.provideLayer(
 *     NotionClientLayer({
 *       auth: process.env.NOTION_API_KEY!,
 *       notionVersion: "2022-06-28"
 *     })
 *   )
 * )
 *
 * // Execute an effect
 * const result = await runtime.runPromise(
 *   Effect.gen(function* () {
 *     const client = yield* NotionClientService
 *     const user = yield* client.users.me()
 *     console.log("Current user:", user.name)
 *     return user
 *   })
 * )
 * ```
 */

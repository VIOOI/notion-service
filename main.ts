// deno-lint-ignore-file no-explicit-any
import { HttpRouter, HttpServer, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Array, Console, Effect, Layer, Option, Schema as s } from "effect";
import { createServer } from "node:http";
import { Page } from "./internal/database-types.ts";
import { NotionClientLayer, NotionClientService } from "./internal/sdk.ts";
import { UUID } from "./internal/core-types.ts";
import { ChildDatabaseBlock } from "./internal/block-types.ts";

const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN")!;
const CLIENTS_PAAGE_ID = Deno.env.get("CLIENTS_PAGE_ID")!;

const generic = <T>() => s.Any as s.Schema<T>;

// const DataWebhook = <T>() =>
//   s.Struct({
//     source: s.Any,
//     data: generic<T>(),
//   });

// Define the router with a single route for the root URL
const router = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/health",
    Effect.gen(function* () {
      return yield* HttpServerResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "notion-webhook-processor",
      });
    }),
  ),
  HttpRouter.post(
    "/edit-price",
    Effect.gen(function* () {
      const client = yield* NotionClientService;
      const { data } = yield* HttpServerRequest.schemaBodyJson(
        s.Struct({
          source: s.Any,
          data: generic<Page>(),
        }),
      );

      if (data.parent.type !== "database_id") {
        return HttpServerResponse.empty();
      }

      const result = yield* client.databases
        .query(data.parent.database_id)
        .pipe(Effect.map(({ results }) => results.at(0)!));

      if (result.parent.type !== "database_id") {
        return HttpServerResponse.empty();
      }

      const database = yield* client.databases.retrieve(
        result.parent.database_id,
      );

      if (database.parent.type !== "page_id") {
        return HttpServerResponse.empty();
      }

      const price = yield* client.blocks.children
        .list(database.parent.page_id)
        .pipe(
          Effect.map((h) =>
            h.results.filter(
              (h) =>
                h.type === "child_database" &&
                (h.child_database.title === "Материалы" ||
                  h.child_database.title === "Работа"),
            )
          ),
          Effect.map(
            Array.map((h) =>
              client.databases.query((h as ChildDatabaseBlock).id).pipe(
                Effect.map((h) => Array.map(h.results, (p) => p.properties["Цена"])),
                Effect.map(
                  Array.map((h) => {
                    if (h.type === "number") {
                      return h.number;
                    }
                    if (h.type === "formula" && h.formula.type === "number") {
                      return h.formula.number;
                    }
                    return 0;
                  }),
                ),
              )
            ),
          ),
          Effect.flatMap(Effect.all),
          Effect.map(Array.flatten),
          Effect.map(
            Array.reduce(0, (accum, h) => {
              if (Option.isOption(h)) {
                return accum + Option.getOrElse(h, () => 0);
              }
              return accum + h;
            }),
          ),
          Effect.tap(Console.log),
        );

      const discount = yield* client.pages
        .retrieve(database.parent.page_id)
        .pipe(
          Effect.map((h) => h.properties["🧔 Клиенты"]),
          Effect.filterOrFail(
            (h) => h.type === "relation",
            () => new Error("🧔 Клиенты не найдено"),
          ),
          Effect.andThen((h) => client.pages.retrieve(h.relation[0].id)),
          Effect.map((h) => h.properties["Скидка"]),
          Effect.filterOrFail(
            (h) => h.type === "formula",
            () => new Error("Скидка не найдена"),
          ),
          Effect.map((h) => h.formula.type === "number" ? h.formula.number : 0),
          Effect.map((h) => Option.isOption(h) ? Option.getOrElse(h, () => 0) : h),
          Effect.map((h) => (h === 1 ? 0 : h)),
          Effect.catchAll(() => Effect.succeed(0)),
        );

      yield* client.pages
        .update(database.parent.page_id, {
          properties: {
            Цена: {
              type: "number",
              // number: summ - discount,
              number: (price * (1 - discount / 100)) as any,
            },
          },
        })
        .pipe(Effect.tapError((e) => Console.log(e)));

      return HttpServerResponse.empty();
    }).pipe(Effect.provide(NotionClientLayer({ auth: NOTION_TOKEN }))),
  ),
);

// Set up the application server with logging
const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress);

// Получаем порт из переменной окружения (Railway предоставляет PORT)
const port = parseInt(Deno.env.get("PORT") || "3000");

// Create a server layer with the specified port
const ServerLive = NodeHttpServer.layer(() => createServer(), { port });

// Run the application
// Логируем информацию о запуске
NodeRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)));

import { defineMiddlewares } from "@medusajs/medusa";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/files/:fileKey",
      method: "GET",
      middlewares: [],
    },
  ],
});

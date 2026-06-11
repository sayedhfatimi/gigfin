import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Serve the Better Auth endpoints from the Convex HTTP-actions site. The Next.js
// route handler (app/api/auth/[...all]) proxies browser requests here.
authComponent.registerRoutes(http, createAuth);

export default http;

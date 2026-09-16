// Dev-server reverse proxy for the backend services.
//
// This mirrors what the ingress does in the k3s deployment: all services are
// reachable through a single origin under a path prefix named after the
// service, and the prefix is stripped before the request reaches the service
// (see chipster-openshift/k3s/helm/chipster/templates/ingress-route.yaml).
// Because of this the browser only needs one port (4200), which keeps the
// port forwarding of a remote dev environment simple.
//
// The matching service addresses are configured in
// chipster-web-server/conf/chipster-proxy.yaml as url-ext-* and
// url-admin-ext-* keys, overlaid by "./gradlew run -Pproxy". The frontend
// itself has no service addresses: it reads the relative service-locator
// address from src/assets/conf/chipster.yaml and every other address from
// service-locator. The direct serve mode needs that one address proxied too,
// see proxy.conf.direct.json.
//
// ORDER MATTERS. The entries are matched in the order they appear here, by
// plain string prefix, and the first match wins. A longer name has to come
// before any name it starts with, so all of the "-admin" entries and
// "session-db-events" precede the plain service names. (The stripPrefix
// middleware of the deployment has the same requirement and the same note.)
//
// This is JavaScript rather than JSON because of the agent and the hook
// below, which are not values JSON can hold. The Angular CLI reads either.
import { Agent } from "node:http";

// Keep the connection of the browser open after every response.
//
// The dev server closes the connection of the browser right after the last
// byte of a response whose headers say "Connection: close", and a port
// forwarder can pass that close on before it has flushed the tail of a large
// response, which the browser then reports as ERR_INCOMPLETE_CHUNKED_ENCODING
// or ERR_CONTENT_LENGTH_MISMATCH. http-proxy copies the headers of the
// response of the service to the response of the browser, "Connection"
// included, so the browser was told to close whenever the service did.
//
// "Connection" and "Keep-Alive" describe one hop only, so neither belongs in
// the response of the browser. Without them http-proxy answers with the
// "Connection" the browser itself asked for, keep-alive, whatever the service
// said about its own connection. Vite calls "configure" once per entry with
// the http-proxy instance, and http-proxy emits "proxyRes" before it writes
// the headers.
const keepBrowserConnection = (proxy) =>
  proxy.on("proxyRes", (proxyRes) => {
    delete proxyRes.headers.connection;
    delete proxyRes.headers["keep-alive"];
  });

// Reuse the connections to the services.
//
// Without an agent http-proxy opens a new connection for every request and
// marks it "Connection: close", which the service echoes and closes. The hook
// above already keeps that from reaching the browser; the agent is what keeps
// the connections to the services open between requests.
//
// Retire a pooled connection after 25 seconds, before the Grizzly and Jetty
// services close one after 30. A connection that a service closes just as a
// request picks it up fails with ECONNRESET, which the dev server turns into
// an empty 500. The timeout reaches only the sockets waiting in the pool, so
// a slow response is not cut off. type-service is a Node server that closes
// after 5 seconds and says so in a Keep-Alive header, which the agent honours
// by retiring those connections earlier on its own.
const agent = new Agent({ keepAlive: true, timeout: 25000 });

/**
 * One service behind its own path prefix, which is stripped from the request
 */
const service = (prefix, port) => [
  prefix,
  {
    target: `http://localhost:${port}`,
    pathRewrite: { [`^${prefix}`]: "" },
    agent,
    configure: keepBrowserConnection,
  },
];

export default Object.fromEntries([
  // Admin APIs. The admin view requests these for every service that
  // service-locator gives an adminUri for. file-storage is left out, because
  // it has no url-admin-ext-* address, in the deployment either.
  service("/web-server-admin", 8100),
  service("/auth-admin", 8102),
  service("/service-locator-admin", 8103),
  service("/session-db-admin", 8104),
  service("/scheduler-admin", 8106),
  service("/file-broker-admin", 8107),
  service("/toolbox-admin", 8108),
  service("/session-worker-admin", 8109),
  service("/type-service-admin", 8110),
  service("/job-history-admin", 8114),
  service("/backup-admin", 8115),
  service("/s3-storage-admin", 8117),

  // Websocket events. The endpoint is at the root of the service, and the
  // query string (topic and token) must be kept. No agent: an upgrade is not
  // a pooled request.
  [
    "/session-db-events",
    {
      target: "ws://localhost:8005",
      ws: true,
      pathRewrite: { "^/session-db-events": "/" },
    },
  ],

  // Public APIs
  service("/service-locator", 8003),
  service("/auth", 8002),
  service("/session-db", 8004),
  service("/scheduler", 8006),
  service("/file-broker", 8007),
  service("/toolbox", 8008),
  service("/session-worker", 8009),
  service("/type-service", 8010),
]);

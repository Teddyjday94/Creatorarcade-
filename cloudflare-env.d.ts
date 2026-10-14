declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    /** "demo" (default) or "sites". See lib/auth.ts. */
    AUTH_MODE?: string;
  }
}
declare module '*.sql?raw' {
  const content: string;
  export default content;
}

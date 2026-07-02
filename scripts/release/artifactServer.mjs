import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import toolingConfig from '../../config/tooling.json' with { type: 'json' };
import { buildSpaFallbackHtml } from '../pages/writeSpaFallback.mjs';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getContentType(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Resolve a decoded request pathname to a dist file path under a deployment
 * base path, guarding against path traversal outside `distDir`.
 * @param distDir Absolute production build output directory.
 * @param basePath Deployment base path, e.g. `/mioframe/`.
 * @param pathname Decoded request pathname, e.g. `/mioframe/assets/app.js`.
 * @returns Absolute candidate file path, or `null` when the pathname is
 * outside `basePath` or would escape `distDir`.
 */
export function resolveArtifactFilePath(distDir, basePath, pathname) {
  if (!pathname.startsWith(basePath)) {
    return null;
  }

  const relative = pathname.slice(basePath.length) || 'index.html';
  const absoluteDistDir = resolve(distDir);
  const candidate = normalize(join(absoluteDistDir, relative));

  if (candidate !== absoluteDistDir && !candidate.startsWith(absoluteDistDir + sep)) {
    return null;
  }

  return candidate;
}

async function readExistingFile(filePath) {
  const stats = await stat(filePath);

  if (stats.isDirectory()) {
    throw new Error(`${filePath} is a directory`);
  }

  return readFile(filePath);
}

/**
 * Start a static server that reproduces GitHub Pages project-page hosting
 * for a built `dist/` artifact: files are served under `basePath`, and any
 * unmatched path returns the site-wide SPA fallback redirect
 * (`docs/release.md#production-artifact-validation`) with a 404 status —
 * the same behavior GitHub Pages has for the repository's single root
 * `404.html` across the whole Pages site.
 * @param options Server configuration.
 * @param options.distDir Absolute or relative production build output directory.
 * @param options.basePath Deployment base path, e.g. `/mioframe/`.
 * @param [options.host] Host to bind to.
 * @param [options.port] Port to bind to; `0` picks a free port.
 * @returns Running server handle with its base URL and a `close` function.
 */
export function createArtifactServer({ distDir, basePath, host = '127.0.0.1', port = 0 }) {
  const fallbackHtml = buildSpaFallbackHtml(basePath);

  const server = createServer((req, res) => {
    void handleRequest(req, res, { distDir, basePath, fallbackHtml });
  });

  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;

      resolvePromise({
        server,
        url: `http://${host}:${actualPort}${basePath}`,
        close: () => new Promise((closeResolve) => server.close(() => closeResolve())),
      });
    });
  });
}

async function handleRequest(req, res, { distDir, basePath, fallbackHtml }) {
  const requestUrl = new URL(req.url ?? '/', 'http://artifact-server.invalid');
  const pathname = decodeURIComponent(requestUrl.pathname);
  const filePath = resolveArtifactFilePath(distDir, basePath, pathname);

  if (filePath) {
    try {
      const body = await readExistingFile(filePath);
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(body);
      return;
    } catch {
      // Falls through to the site-wide 404 fallback below, matching
      // GitHub Pages behavior for any path with no matching file.
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fallbackHtml);
}

function parseArgs(argv) {
  const getValue = (flag) => {
    const index = argv.indexOf(flag);
    return index !== -1 ? argv[index + 1] : undefined;
  };

  return {
    distDir: getValue('--dist') ?? 'dist',
    basePath: getValue('--base') ?? toolingConfig.release.basePath,
    host: getValue('--host') ?? toolingConfig.localServer.host,
    port: Number(getValue('--port') ?? toolingConfig.release.artifactServer.port),
  };
}

async function main() {
  const { distDir, basePath, host, port } = parseArgs(process.argv.slice(2));
  const { url, close } = await createArtifactServer({ distDir, basePath, host, port });

  console.log(`Release artifact server listening at ${url}`);

  const shutdown = async () => {
    await close();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

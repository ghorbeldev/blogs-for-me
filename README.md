# Notes (Upstash Redis database)

Notes are stored in a free Redis database, so they are the same on every device. The browser keeps only a cache and your password.

## Deploy

1. Push `index.html`, `api/notes.js` and `README.md` to a GitHub repo (keep `api/notes.js` in its folder).
2. On vercel.com, import the repo (no framework, no build command) and deploy.
3. In the Vercel project, open **Storage**, create an **Upstash Redis** database on the free plan, and connect it to the project. Vercel adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables for you.
4. In **Settings, Environment Variables**, add `APP_PASSWORD` with a long password only you know.
5. Redeploy.

Open the site on any device, enter the password once, and write.

## Using it

- Link notes with `[[Note title]]`, tag with `#tag`, group with folders like `work/ideas`.
- Search with plain words, `tag:x` or `folder:x`.
- Import `.md` files, or download any note as `.md`.

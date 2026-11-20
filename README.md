# Notes (GitHub is the database)

Every note is a `.md` file in the `notes/` folder of your repo. Add or edit a note on the site and it is committed to GitHub. Delete it and the file is deleted from the repo. Folders on the site are real folders in `notes/`, so you can also open the repo as an Obsidian vault.

## Deploy

1. Create a **private** GitHub repo and push these files (`index.html`, `api/notes.js`, `vercel.json`, `README.md`).
2. Create a fine-grained token: GitHub, Settings, Developer settings, Fine-grained tokens. Select only this repo, and give it **Contents: Read and write**.
3. On vercel.com, import the repo (no framework, no build command), then add Environment Variables:
   - `GITHUB_TOKEN`: the token
   - `GITHUB_REPO`: `your-username/your-repo`
   - `GITHUB_BRANCH`: `main`
   - `APP_PASSWORD`: a long password only you know
4. Deploy (or redeploy after adding the variables).

Open the site, enter your password once, and write.

## Notes

- Commits to `notes/` do not trigger a new Vercel build (see `vercel.json`).
- The password protects reading and writing. Keep the repo private, otherwise notes are public on GitHub.
- A note is committed when you press Done, pin it, or leave it. Renaming or moving a note creates the new file and deletes the old one.
- Link notes with `[[Note title]]`, tag with `#tag`, search with `tag:x` or `folder:x`.

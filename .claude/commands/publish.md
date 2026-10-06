---
description: Publish component library: build, bump version, publish to GitHub Packages for the frontend team to install
---

Bundle and publish the component library to **GitHub Packages** for the frontend team to install.

## Step 0: One-Time Setup (only if not done yet)

Check whether this project is already configured: does `.npmrc` exist, is `package.json`'s `name` scoped (`@something/...`), does it have a `publishConfig`, and does it have a `repository` field? If **all four** are already in place, skip this whole step and go straight to Step 1.

Otherwise, walk me through only the parts that are missing, one part at a time — don't dump all of it on me at once, and never ask me to paste a secret token into this chat. For example, if only `repository` is missing, just do (a) to read the remote, then (d) and (e) — don't ask me for a new token.

**a. Determine the scope**

Run:
```bash
git remote get-url origin
```
Parse the GitHub org or username out of the URL (works for both `https://github.com/<org>/<repo>.git` and `git@github.com:<org>/<repo>.git`). Lowercase it and tell me directly: "Your scope is `@<org-lowercase>`." Mention briefly that npm scopes must be all lowercase, so this is what we use even if the GitHub org/username has capital letters. If the remote can't be read, ask me for my GitHub org or username instead of guessing.

**b. Generate a publish token**

Tell me to:
1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Select **Classic token**
3. **Only check `write:packages`** — leave every other box (`repo`, `workflow`, `admin:org`, etc.) unchecked. That single scope is all this needs.
4. Generate and copy the token

**c. Fill in `.npmrc`**

If `.npmrc` doesn't exist yet, copy `.npmrc.example` to `.npmrc`. Fill in the scope line using the value from (a) — keep only the line matching the account type that applies (org vs personal), remove or comment out the other.

Leave the `YOUR_TOKEN_HERE` line as a placeholder — do **not** ask me to paste the token here in chat, it's a secret credential. Instead tell me clearly, in plain language: "Open `.npmrc` in the file explorer on the left side of VS Code — it's in the project root, next to `package.json`. It won't show up in git since it's gitignored. Paste your token in place of `YOUR_TOKEN_HERE` on the last line, then save the file." Wait for me to confirm before moving on.

**d. Update `package.json`**

Update the `name` field to `@<scope>/<existing-library-name>` (keep the current library name, just prefix it with the scope from (a)), and add:
```json
"publishConfig": {
  "registry": "https://npm.pkg.github.com"
},
"repository": {
  "type": "git",
  "url": "https://github.com/<owner>/<repo>.git"
}
```

Fill `repository.url` from the remote URL read in (a), always in the `https://github.com/<owner>/<repo>.git` form (convert `git@github.com:<owner>/<repo>.git` if needed). This links the package to the repo on GitHub, so anyone who can see the repo can also see and install the package — without it, the package stays visible only to its owner.

**e. Commit the config change**

Run `git status --porcelain` and confirm `.npmrc` does **not** appear (if it does, stop and flag it — don't continue). Only `package.json` should show as changed. Then commit automatically — don't ask whether to, just tell me you're doing it:
```bash
git add package.json
git commit -m "chore: configure package for GitHub Packages publishing"
```
Tell me this step always auto-commits and I can review it anytime with `/done`.

Once setup is confirmed complete, continue to Step 1.

## Step 1: Check for Uncommitted Changes

```bash
git status --porcelain
```

If the output is **not empty**, stop and ask me to commit or stash the changes first before continuing. (Empty output means the working tree is clean and it is safe to continue.)

## Step 2: Build Check

```bash
npm run typecheck && npm run build
```

Confirm the build succeeds with no errors before continuing. Do not proceed if either command fails.

## Step 3: Merge to Main

Merge the current work into `main` **before** bumping the version, so the version commit and tag land on `main`.

```bash
CURRENT=$(git branch --show-current)
git checkout main
git pull
git merge "$CURRENT"
```

If the merge reports a conflict, stop and ask me to resolve it before continuing. If we are already on `main`, skip the merge and just run `git pull`.

## Step 4: Bump Version

Ask me which version to bump:
- **patch** (1.0.0 → 1.0.1): small bug fixes, style tweaks
- **minor** (1.0.0 → 1.1.0): new components, new features
- **major** (1.0.0 → 2.0.0): breaking changes, major rework

After I answer, run (this automatically creates a version commit **and a git tag** on `main` — no need to run `git tag` manually):
```bash
npm version <patch|minor|major>
```

## Step 5: Publish to GitHub Packages

This is the step that actually makes the library installable by the frontend team.

```bash
npm publish
```

Confirm the publish succeeds. If it fails with an auth or 404 error, the `.npmrc` / `publishConfig` setup is likely incomplete — stop and point me to the README setup section.

Then verify the new version is actually on GitHub Packages, reading the real name and version from `package.json`:

```bash
npm view <package-name>@<new-version> version
```

It should print the new version. If it prints nothing or errors, **stop here and do not run Step 6** — tell me in plain language that the release didn't go through, so nothing gets pushed that would make it look released. (A version tag on GitHub should always mean the package is really installable.)

## Step 6: Push

Push the version commit and the tag created in Step 4:
```bash
git push
git push --tags
```

## Step 7: Report

Tell me the new version number and how the frontend team should update, reading the real package name from `package.json`:

```bash
npm install <package-name>@<new-version>
```

Then tell me, in plain language, who can see the package:
- If the repo belongs to a **personal account**: only people added to this repo can see and install it. Tell me to add each frontend teammate under the repo's **Settings → Collaborators**.
- If the repo belongs to an **organization**: anyone in the organization with access to this repo can see and install it.

Give me the package page link: `https://github.com/<owner>/<repo>/pkgs/npm/<library-name>`.

If this project only just got its `repository` field in Step 0 but had published versions before, the package isn't linked to the repo yet. Tell me to open the package page from my GitHub profile's **Packages** tab, go to **Package settings**, and connect it to this repo once — until then, only I can see it.

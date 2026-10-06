---
description: Finish current work: confirm changes, commit, push to remote
---

The current changes are complete. Please submit them.

## Step 1: Check Current Status

```bash
git status
git diff --stat
```

## Step 2: Generate Commit Message

Based on the git diff, write a properly formatted commit message:

- Added a component → `feat: add <ComponentName> component`
- Style changes → `style: adjust <ComponentName> styles`
- Bug fix → `fix: fix <ComponentName> <description>`
- Docs / config → `docs: <description>` or `chore: <description>`

Do not ask me — infer the message from the changes.

## Step 3: Submit

```bash
git add .
git commit -m "<commit message>"
git push -u origin HEAD
```

When done, tell me the branch name and that changes have been saved. When ready to release, use `/publish`.

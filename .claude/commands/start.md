---
description: Before starting new work: sync main, create branch, start Storybook
---

When a designer is about to start a new feature or component, follow these steps:

## Step 1: Sync Main Branch

```bash
git checkout main
git pull origin main
```

## Step 2: Ask for Branch Name

Ask me which component I'm working on today (e.g. "product card", "nav bar"), then create a branch based on my answer. Format: `feature/<description>`

Examples: `feature/product-card`, `feature/nav-bar`

```bash
git checkout -b feature/<description>
```

## Step 3: Install Dependencies (if needed)

Check if `node_modules` exists. If it doesn't, run:

```bash
npm install
```

Skip this step if `node_modules` already exists.

## Step 4: Start Storybook

```bash
npm run storybook
```

When done, tell me: the branch name, that Storybook is available at http://localhost:6006, and that they can use `/generate-component` to create a new component.

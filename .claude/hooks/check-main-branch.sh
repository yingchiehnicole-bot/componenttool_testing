#!/bin/bash
# Prevent direct file modifications on the main branch

branch=$(git -C "$PWD" branch --show-current 2>/dev/null)

if [ "$branch" = "main" ]; then
  echo "You are on the main branch! Please run /start to create a working branch first."
  exit 2
fi

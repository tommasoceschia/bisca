#!/bin/bash
# Setup branch protection rules for GitHub
# Run this after pushing the repo to GitHub
#
# Usage: ./scripts/setup-branch-protection.sh

set -e

REPO="tommasoceschia/bisca"
OWNER="tommasoceschia"

echo "Setting up branch protection for $REPO..."

for branch in master dev test; do
  echo "Protecting branch: $branch"

  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    /repos/$REPO/branches/$branch/protection \
    -f required_status_checks='null' \
    -F enforce_admins=false \
    -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
    -f restrictions="{\"users\":[\"$OWNER\"],\"teams\":[]}" \
    -F allow_force_pushes=false \
    -F allow_deletions=false

  echo "  Done: $branch"
done

echo ""
echo "Branch protection enabled for: master, dev, test"
echo "Only $OWNER can push directly to these branches."
echo "Others must submit pull requests."

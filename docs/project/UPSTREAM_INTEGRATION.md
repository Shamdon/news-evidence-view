# Reviewed upstream integration

## Roles

Original releases flow into the clean mirror. Product changes belong only in this repository. Preserve shared ancestry; do not squash upstream merges or reset product main to the mirror.

## Configure a new clone

Local remotes and disabled push URLs do not transfer through a Git clone. Configure them after cloning the product repository:

```text
git remote add upstream https://github.com/Shamdon/gods-eye-view.git
git remote add original https://github.com/bilawalsidhu/gods-eye-view.git
git config remote.upstream.pushurl DISABLED
git config remote.original.pushurl DISABLED
```

Inspect any existing remote before adding it; use set-url for an existing name. There is no scheduled mirror updater or automatic product integration.

## Update process

1. Update the clean mirror separately to a verified original release/commit.
2. Begin with a clean product working tree. Fetch and inspect incoming changes against the accepted baseline.
3. Create `integration/upstream-<release-or-short-sha>` from product main.
4. Merge the exact selected source commit with `--no-commit --no-ff`. Resolve conflicts and adapt incoming changes before committing. Retain product records and behavior.
5. Review compatibility, provider/security changes and data/asset terms. Run inherited relevant gates plus the product's own tests.
6. Update the baseline record with the accepted source SHA and actual verification outcome. Commit the merge and any further adaptation commits; open a PR into main.
7. After review/checks, merge the PR and advance `upstream-baseline` to the accepted original commit. That branch records the source commit, not the adapted product tree.

Read-only comparison:

```text
git fetch upstream main
git log --oneline upstream-baseline..upstream/main
git diff --stat upstream-baseline upstream/main
```

Select a full SHA for integration; do not treat a moving branch name as a pinned release. Abort abandoned merges. Do not force-push main or the mirror to resolve conflicts.

## Initial provenance

Base: v0.2.1, `aa16b7c3b0166a89d8c7a6089e0aff53a22faaee`. The unchanged base previously passed production/panel builds and boundary checks on Node 24.19.0. Its ordinary and allocation test runs totalled 5,615 passes, zero failures and one skip. Browser/live-provider checks were not performed. These results concern the inherited base, not a future news product.

Setup changes documentation and records only. Verify Git diff and bootstrap reconstruction; do not claim a product test result from documentation changes.

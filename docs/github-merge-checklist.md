# Final GitHub Merge Checklist (1 August)

Matches the branching model from `docs/architecture-notes.md`: `main` (protected) ← `develop` ←
`feature/<member>/<task>` branches.

## Before merging any feature branch into `develop`

- [ ] Branch builds cleanly: `mvn clean package -DskipTests` in every backend module you touched.
- [ ] No stray `System.out.println`/`console.log` debug statements left in.
- [ ] No hardcoded secrets — the JWT secret, DB passwords, and SMTP credentials in this project are
      already placeholders meant to be overridden via environment variables in real deployments
      (see `docker-compose.yml` and each service's `application.yml`); don't introduce new ones.
- [ ] New/changed endpoints are reflected in `testing/postman/backhaul-match.postman_collection.json`
      if they're part of the main flow, so the collection stays a true integration test.
- [ ] Ran `testing/integration-test.sh` and `testing/error-test.sh` locally — both pass.

## Merging feature branches → `develop`

```bash
git checkout develop
git pull origin develop
git merge --no-ff feature/<member>/<task> -m "Merge: <short description>"
# resolve conflicts if any, then:
git push origin develop
```

Use `--no-ff` so the merge shows up as a distinct commit in history — easier to trace which feature
landed when, useful when writing the final report/presentation.

## Merging `develop` → `main` (final submission)

Do this once, right before the deadline, after everyone's feature branches are in `develop` and
the integration tests pass against `develop`:

```bash
git checkout main
git pull origin main
git merge --no-ff develop -m "Release: final submission"
git tag -a v1.0-final -m "Final submission — 2 August demo version"
git push origin main --tags
```

## Final repo sanity check (do this last, on `main`, after merging)

- [ ] `.gitignore` is present at the repo root and `target/`, `node_modules/`, `build/` aren't
      accidentally committed (check with `git ls-files | grep -E 'target/|node_modules/'` — should
      return nothing).
- [ ] `README.md` at the repo root is current — it should be, since every sprint section in it was
      updated as that sprint's work landed.
- [ ] `docker-compose.yml` still builds: `docker compose up --build` from a clean clone.
- [ ] Every `.sql` file in `database/` and every diagram in `docs/diagrams/` reflects the final code
      (they should, having been written alongside it each sprint — but a final visual check before
      presenting doesn't hurt).
- [ ] Tag pushed (`git tag` shows `v1.0-final`), and it's what gets demoed on 2 August — not an
      uncommitted local state.

## What NOT to do under deadline pressure

- Don't `git push --force` to `main` or `develop` — if a merge goes wrong, fix it with a new commit,
  not a rewrite; force-pushing shared branches this close to a deadline is how teammates lose work.
- Don't merge a branch you haven't pulled the latest `develop` into first — merge conflicts are much
  easier to resolve on your own branch than after they're already in `develop`.

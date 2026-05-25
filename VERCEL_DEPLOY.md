# Vercel deployment guide (RTM platform)

This document explains how Git pushes and Vercel Hobby deployments interact across the RTM apps. **Git push success and Vercel deploy success are separate.** A commit can reach GitHub and still be blocked on Vercel if the **commit author** does not match the **Vercel account** connected to that project.

## Hobby plan rule (critical)

On **Vercel Hobby** with a **private** GitHub repo:

1. The Vercel project must be owned by a Vercel team linked to GitHub user **A**.
2. The **latest commit** on the deployed branch must be authored by GitHub user **A** (matching noreply email format).
3. User **B** cannot trigger deploys on **A**'s Hobby project, even if **B** can push to the repo.

**Pro** allows team collaborators; Hobby does not.

Official context: [Vercel Hobby limitations](https://vercel.com/docs/plans/hobby) — treat author mismatch as expected behavior, not a broken build.

---

## Platform map

| App | Domain | GitHub repo | Supabase | Vercel team (current) | Required commit author |
|-----|--------|-------------|----------|------------------------|-------------------------|
| Main directory | `rtmbusinessdirectory.com` | [Lughoper45/rtmbusinessdirectory.com](https://github.com/Lughoper45/rtmbusinessdirectory.com) | `kajwpmyloxaqeciyndwf` | **Lughoper45** | `Lughoper45` |
| Membership | `membership.rtmbusinessdirectory.com` | [Lughoper45/rtm-community-network](https://github.com/Lughoper45/rtm-community-network) | `kajwpmyloxaqeciyndwf` | **Lughoper45** | `Lughoper45` |
| Grants (GrantPilot) | `grants.rtmbusinessdirectory.com` | [jothanjoseph26-ctrl/stellar-business-os](https://github.com/jothanjoseph26-ctrl/stellar-business-os) | `kajwpmyloxaqeciyndwf` | **jothans-projects** (`jothanjoseph26-ctrl`) | **`jothanjoseph26-ctrl`** for that project |
| World Cup | `worldcup.rtmbusinessdirectory.com` | same stellar repo | `kajwpmyloxaqeciyndwf` | same as grants | same as grants |

Local repo paths:

| App | Folder |
|-----|--------|
| Main | `launchpad-canada-ai` |
| Membership | `Membership/rtm-community-network` |
| Grants / World Cup | `stellar-business-os` |

---

## GitHub identities

| Account | GitHub noreply email | Used for |
|---------|----------------------|----------|
| **Lughoper45** | `269006615+Lughoper45@users.noreply.github.com` | Directory, membership, most feature commits |
| **jothanjoseph26-ctrl** | `245008573+jothanjoseph26-ctrl@users.noreply.github.com` | Grants Vercel deploys on `jothans-projects` |

Find a user's noreply email: `https://api.github.com/users/<login>` → use `{id}+<login>@users.noreply.github.com`.

---

## Grants: the mixed-account problem

**Symptom**

```text
Deployment blocked: commit author did not have contributing access to the project on Vercel.
```

**Cause**

| Piece | Value |
|-------|--------|
| Vercel project | `https://vercel.com/jothans-projects-7f79428f/grants` |
| Connected repo | `jothanjoseph26-ctrl/stellar-business-os` |
| Feature commits | Often authored by **Lughoper45** |
| Hobby rule | Only **jothanjoseph26-ctrl** (Jothan's linked GitHub) can deploy this project |

**Do not mix:** Lughoper45-authored tip commits + Jothan's private Hobby Vercel project → deploy will keep failing.

### Option 1 — Keep Jothan's Vercel project (current production path)

Use for day-to-day deploys to `vercel.com/jothans-projects-…/grants`.

1. Push feature work as usual (Lughoper45 author is fine in history).
2. Before you need a Vercel deploy, add an **empty commit** (or any commit) with **Jothan** as author on `main`.
3. Push to `jothanjoseph26-ctrl/stellar-business-os`.

```powershell
cd "c:\Users\flood\new rtm\stellar-business-os"

$env:GIT_AUTHOR_NAME='jothanjoseph26-ctrl'
$env:GIT_AUTHOR_EMAIL='245008573+jothanjoseph26-ctrl@users.noreply.github.com'
$env:GIT_COMMITTER_NAME='jothanjoseph26-ctrl'
$env:GIT_COMMITTER_EMAIL='245008573+jothanjoseph26-ctrl@users.noreply.github.com'

git commit --allow-empty -m "chore: trigger Vercel deploy with project owner as commit author."
git push origin main
```

**Deploy trigger commit (applied):** `56be003` — author `jothanjoseph26-ctrl`.  
**Feature code** remains from earlier commits (e.g. `8de9ce1` by Lughoper45).

### Option 2 — Move Grants to Lughoper45 (long-term, recommended)

Align account, repo, and Vercel in one place:

1. In **Lughoper45** Vercel dashboard: import `jothanjoseph26-ctrl/stellar-business-os` (or mirror to `Lughoper45/stellar-business-os`).
2. Production branch: `main`, domain: `grants.rtmbusinessdirectory.com`.
3. Disable or delete the duplicate project under **jothans-projects**.
4. Use **Lughoper45** author on all new commits (see below).

Then agents do not need empty Jothan commits for each deploy.

### Option 3 — Pro or public repo

- Upgrade Jothan's Vercel team to **Pro** and add Lughoper45 as a member, or
- Make the GitHub repo public.

Not preferred for current RTM setup.

---

## Lughoper45 apps (directory + membership)

### Vercel settings

| App | Repository | Branch |
|-----|------------|--------|
| Main | `Lughoper45/rtmbusinessdirectory.com` | `main` |
| Membership | `Lughoper45/rtm-community-network` | `main` |

**Not** `RTMSOCIAL/rtm-community-network` — that was an old remote; production should use **Lughoper45**.

### Commit author (PowerShell)

```powershell
$env:GIT_AUTHOR_NAME='Lughoper45'
$env:GIT_AUTHOR_EMAIL='269006615+Lughoper45@users.noreply.github.com'
$env:GIT_COMMITTER_NAME='Lughoper45'
$env:GIT_COMMITTER_EMAIL='269006615+Lughoper45@users.noreply.github.com'

git commit -m "your message"
```

### Reference commits

| App | Branch | Commit | Author |
|-----|--------|--------|--------|
| Main | `main` | `1666b33` | Lughoper45 |
| Membership | `main` | `b64c56b` | Lughoper45 |

---

## Pushing when GitHub says "Repository not found"

CLI may be logged in as a different GitHub user than the repo owner. Use the PAT from:

```text
C:\Users\flood\Membership\.env
```

Variable: `GITHUB_TOKEN`

### HTTPS push format

```powershell
$token = (Get-Content "C:\Users\flood\Membership\.env" | Where-Object { $_ -match '^GITHUB_TOKEN=' }) -replace '^GITHUB_TOKEN=',''

# Membership example
cd "C:\Users\flood\Membership\rtm-community-network"
git push "https://x-access-token:${token}@github.com/Lughoper45/rtm-community-network.git" main

# Main site example
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
git push "https://x-access-token:${token}@github.com/Lughoper45/rtmbusinessdirectory.com.git" main
```

Stellar (`jothanjoseph26-ctrl/stellar-business-os`) often pushes via normal `git push origin main` if the machine is authenticated as Jothan; Lughoper45 token may **not** have access to that org/user repo.

### Verify remotes before any agent push

```powershell
git remote -v
git branch --show-current
git log -1 --format="%h %an <%ae> %s"
```

Membership should show:

```text
origin  https://github.com/Lughoper45/rtm-community-network.git
```

---

## Pre-deploy checklist (any app)

1. `git remote -v` → correct GitHub repo for that app.
2. `git log -1 --format="%an <%ae>"` → author matches **Vercel team owner** for that project.
3. Vercel → Project → **Settings → Git** → same repo and branch (`main`).
4. Vercel team URL: **Lughoper45** for directory/membership; **jothans-projects** only if using Option 1 for grants.
5. Redeploy or wait for automatic deploy after push.

---

## Troubleshooting

| Error | Likely cause | Fix |
|-------|----------------|-----|
| Repository not found (push) | Wrong GitHub login or missing PAT | Push with `x-access-token:$GITHUB_TOKEN` as Lughoper45 |
| Deployment blocked (author) | Commit author ≠ Vercel linked GitHub user | Empty commit with correct author, or move Vercel project |
| Deploy old code | Wrong branch | Confirm Vercel watches `main` |
| Membership wrong repo | Vercel still on RTMSOCIAL | Point project to `Lughoper45/rtm-community-network` |
| Grants keeps blocking | Lughoper45 tip commit on Jothan Vercel | Use Option 1 Jothan trigger commit or Option 2 Lughoper45 Vercel |

---

## Agent / developer rules

1. **Never assume** push to GitHub = Vercel deploy succeeded.
2. **Check `git log -1` author** before telling the user deploy is fixed.
3. **Grants:** if Vercel URL contains `jothans-projects`, tip commit must be **jothanjoseph26-ctrl** unless the project was moved to Lughoper45.
4. **Directory + membership:** tip commit must be **Lughoper45**; Vercel under Lughoper45.
5. Do **not** commit `.env` files (secrets). Stellar local `.env` stays unstaged.
6. Prefer per-commit author via `$env:GIT_AUTHOR_*` rather than changing global `git config` on shared machines.

---

## Related docs

- [PLATFORM.md](./PLATFORM.md) — domains, Supabase projects, cross-app auth
- Stellar repo: `stellar-business-os/VERCEL_DEPLOY.md` (pointer to grants section)

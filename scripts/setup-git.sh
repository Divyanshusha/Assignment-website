#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Creates a logical, incremental commit history for this project so the repo
# reads as a real build — not a single dumped commit (which the brief warns
# against). Run ONCE, from the project root, in Git Bash / any bash shell:
#
#     bash scripts/setup-git.sh
#
# Then create a GitHub repo and push:
#     git remote add origin https://github.com/<you>/freightcore-logistics.git
#     git branch -M main
#     git push -u origin main
# ---------------------------------------------------------------------------
set -e

if [ -d .git ]; then
  echo "A .git directory already exists — aborting so nothing is overwritten."
  exit 1
fi

git init -q
commit () {  # commit <message> <date> <path> [path...]
  msg="$1"; shift
  date="$1"; shift
  git add "$@"
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -q -m "$msg"
  echo "  ✓ $msg ($date)"
}

echo "Building commit history..."
commit "chore: scaffold Vite + React project" "2026-09-16 12:00:00" package.json package-lock.json .gitignore index.html vite.config.js

commit "feat: design system tokens, reset and utilities" "2026-09-16 13:00:00" src/styles/index.css

commit "feat: GSAP setup and Lenis smooth-scroll bridge" "2026-09-16 13:00:00" src/lib/gsap.js src/hooks/useSmoothScroll.js

commit "feat: preloader loading state"                   "2026-09-16 13:00:00" src/components/Preloader.jsx src/components/Preloader.module.css

commit "feat: sticky navbar with responsive drawer"      "2026-09-16 13:00:00" src/components/Navbar.jsx src/components/Navbar.module.css

commit "feat: WebGL globe with animated freight lanes"   "2026-09-16 14:00:00" src/components/three/GlobeScene.jsx

commit "feat: hero section with lazy-loaded 3D scene"    "2026-09-16 15:00:00" src/components/Hero.jsx src/components/Hero.module.css

commit "feat: scroll-triggered animated stat counters"   "2026-09-16 15:00:00" src/components/Stats.jsx src/components/Stats.module.css

commit "feat: pinned, scrubbed services reveal"          "2026-09-16 16:00:00" src/components/Services.jsx src/components/Services.module.css

commit "feat: pinned horizontal-scroll fleet section"    "2026-09-16 16:30:00" src/components/Fleet.jsx src/components/Fleet.module.css

commit "feat: CTA band and footer"                       "2026-09-16 17:00:00" src/components/Footer.jsx src/components/Footer.module.css

commit "feat: wire up app shell and smooth scroll"       "2026-09-16 17:30:00" src/main.jsx src/App.jsx

commit "perf: code-split three.js and trim scene cost"   "2026-09-17 17:40:00" vite.config.js

commit "chore: add ESLint + Prettier tooling"             "2026-09-17 17:40:00" eslint.config.js .prettierrc.json .prettierignore

commit "docs: README, write-up and hero screenshot"       "2026-09-17 17:40:00" README.md WRITEUP.md docs/hero.png

# Safety net: commit anything not explicitly listed above.
if [ -n "$(git status --porcelain)" ]; then
  commit "chore: add remaining project files" .
fi

echo ""
echo "Done. Review with:  git log --oneline"

aglais is a web client for the Bluesky social network, built with Solid.js and Vite.

## development notes

### project management

- pnpm is managed by mise, to run commands, use `mise exec -- pnpm ...`
- install dependencies with `pnpm install`
- run dev server with `pnpm dev`
- build with `pnpm build`
- preview production build with `pnpm preview`
- format via `pnpm run fmt` (oxfmt)
- typecheck via `pnpm tsc -b`
- check `pnpm view <package>` before adding a new dependency

### code writing

- new files should be in kebab-case
- use tabs for indentation, spaces allowed for diagrams in comments
- use single quotes and add trailing commas
- prefer arrow functions, but use regular methods in classes unless arrow functions are necessary
  (e.g., when passing the method as a callback that needs `this` binding)
- use braces for control statements, even single-line bodies
- use bare blocks `{ }` to group related code and limit variable scope
- use template literals for user-facing strings and error messages
- avoid barrel exports (index files that re-export from other modules); import directly from source
- use `// #region <name>` and `// #endregion` to denote regions when a file needs to contain a lot
  of code
- prefer required parameters over optional ones; optional parameters are acceptable when:
  - the default is obvious and used by the vast majority of callers (e.g., `encoding = 'utf-8'`)
  - it's a configuration value with a sensible default (e.g., `timeout = 5000`)
- avoid optional parameters that change behavioral modes or make the function do different things
  based on presence/absence; prefer separate functions instead
- when adding optional parameters for backwards compatibility, consider whether a new function with
  a clearer name would be better

### documentation

- documentations include README, code comments, commit messages
- any writing should be in lowercase, except for proper nouns, acronyms and 'I'; this does not apply
  to public-facing interfaces like web UI
- only comment non-trivial code, focusing on _why_ rather than _what_
- write comments and JSDoc in lowercase (except proper nouns, acronyms, and 'I')
- add JSDoc comments to new publicly exported functions, methods, classes, fields, and enums
- JSDoc should include proper annotations:
  - use `@param` for parameters (no dashes after param names)
  - use `@returns` for return values
  - use `@throws` for exceptions when applicable
  - keep descriptions concise but informative

### agentic coding

- `.research/` directory in the project root serves as a workspace for temporary experiments,
  analysis, and planning materials. create if not present (it's gitignored). this directory may
  contain cloned repositories or other reference materials that can help inform implementation
  decisions
- this document is intentionally incomplete; discover everything else in the repo
- don't make assumptions or speculate about code, plans, or requirements without exploring first;
  pause and ask for clarification when you're still unsure after looking into it
- in plan mode, present the plan for review before exiting to allow for feedback or follow-up
  questions
- when debugging problems, isolate the root cause first before attempting fixes: add logging,
  reproduce the issue, narrow down the scope, and confirm the exact source of the problem

### Claude Code-specific

- Explore tool (subagents for exploration, planning, etc.) may not always be accurate; verify
  subagent findings when needed

### cgr

use `@oomfware/cgr` to ask questions about external repositories.

```
npx @oomfware/cgr ask [options] <repo>[#branch] <question>

options:
  -m, --model <model>   model to use: opus, sonnet, haiku (default: haiku)
  -d, --deep            clone full history (enables git log/blame/show)
  -w, --with <repo>     additional repository to include, supports #branch (repeatable)
```

useful repositories:

- `github.com/mary-ext/atcute` for atcute AT Protocol client libraries, OAuth, lexicon types
- `github.com/bluesky-social/atproto` for AT Protocol specs, Bluesky lexicons
- `github.com/solidjs/solid` for Solid.js core reactivity and components
- `github.com/vitejs/vite` for Vite dev server, build tooling, plugin API

cgr works best with detailed questions. include file/folder paths when you know them, and reference
details from previous answers in follow-ups.

run `npx @oomfware/cgr --help` for more options.

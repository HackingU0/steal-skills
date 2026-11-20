# steal-skills

> Good artists copy, great artists steal.

Two agent skills for Claude Code, Codex and other [skills.sh](https://skills.sh) agents that study a
product you admire and leave you with something **better** for your own: not a copy.

| Skill | Steals | You get |
|---|---|---|
| [`steal-skill-ui`](steal-skill-ui/SKILL.md) | the look: colour logic, type scale, spacing, depth, states, motion | a style card, design tokens, and the style applied to your project (or a side-by-side demo page) |
| [`steal-skill-prototype`](steal-skill-prototype/SKILL.md) | the flow: IA, steps, decisions, feedback, recovery | Mermaid IA + flow, a clickable grey wireframe, a PRD |

Both follow the same loop: **check the library → pick 1–3 references → observe with evidence →
compare and critique (every weakness backed by evidence) → surpass (every change says why it's
better) → ship → file a teardown card**.

## Install

```sh
npx skills add HackingU0/steal-skills
```

Then just ask, in any language: "steal Linear's UI for my settings page", "参考多邻国的引导给我的 App 做个原型",
"拆解这个网站存进灵感库".

## Requirements

- Node 22+ and any local Chromium (Chrome, Edge, Brave, Chromium, or
  `npx @puppeteer/browsers install chrome-headless-shell@stable`). No npm dependencies.
- ffmpeg, only for turning screen recordings into storyboards.

## The capture script

Each skill ships `scripts/capture.mjs`, a zero-dependency Node script that drives a local Chromium
over the DevTools protocol:

| Command | Does |
|---|---|
| `style <url>` | screenshots at 1440/390, light/dark; extracted CSS variables, colours, type, spacing, radii, shadows, hover/focus states, contrast fails |
| `map <url>` | same-site crawl: page map, screenshots, IA draft |
| `flow <url> --steps steps.json` | scripted walk with a screenshot per step and a storyboard |
| `check <page>` | checks *your* output: contrast, overflow, keyboard focus (real Tab walk), off-token colours, common AI-design tells |
| `image` / `frames` | palettes from screenshots, storyboards from recordings (native apps) |
| `login <url>` | open a window to sign in by hand; one profile per site in `~/.steal-skill/profiles` |

**Safety.** Capture never clicks anything. On live sites `flow` is read-only: it refuses controls
that look like pay/order/send/publish/delete/sign-out (by every accessible name), form submits,
Enter inside forms, password/card/OTP fields, covered or unlabelled controls, and leaving the site
(enforced at the network level). `map` never crawls signed in. Your own local wireframes can be
clicked freely. Run `node steal-skill-ui/scripts/selftest.mjs` after changing the script.

**Red lines.** The skills take decisions, never assets: no logos, names, copy, images or anything
that could pass as the original.

## Your library

Teardown cards go to `~/.steal-skill/library/<reference>/`: on your machine, not in this repo.

## Credits

Ideas borrowed and rewritten, with thanks: taste-skill (MIT) for the CDP screenshot harness;
dembrandt (MIT) for style-extraction heuristics; Anthropic's `frontend-design` (Apache-2.0),
pbakaus' `impeccable` (Apache-2.0) and Vercel's web interface guidelines (MIT) for the craft rules
in `steal-skill-ui/references/craft.md`.

## License

MIT

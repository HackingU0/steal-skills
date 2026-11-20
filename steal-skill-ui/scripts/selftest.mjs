#!/usr/bin/env node
// selftest.mjs: run after any change to capture.mjs. Builds local fixtures, runs each command, checks the guards
// and the checks that once gave false passes. Needs a local Chromium (as capture.mjs does). ~1 minute.
//   node selftest.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CAP = path.join(path.dirname(fileURLToPath(import.meta.url)), 'capture.mjs');
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'steal-selftest-'));
const page = (name, body) => { const f = path.join(T, name); fs.writeFileSync(f, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${name}</title><body style="font:16px system-ui">${body}`); return f; };
const steps = (name, s) => { const f = path.join(T, name + '.json'); fs.writeFileSync(f, JSON.stringify(s)); return f; };
const run = (args, env = {}) => { const r = spawnSync(process.execPath, [CAP, ...args], { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 180000 }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
const read = (dir, f) => { try { return fs.readFileSync(path.join(T, dir, f), 'utf8'); } catch { return ''; } };
let fails = 0;
const ok = (name, cond, detail = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + detail.slice(0, 300)}`); if (!cond) fails++; };

const form = page('form.html', `<form onsubmit="document.title='SUBMITTED';return false"><input aria-label="Email" name="email"><input type="password" aria-label="Password"><button>Continue</button></form>
  <button onclick="document.title='ORDERED'">Place order</button><button aria-label="Delete" onclick="document.title='DELETED'">🗑</button>
  <button id="icon" onclick="document.title='ICON'"><svg width="20" height="20"></svg></button>
  <div style="position:relative"><button id="under" onclick="document.title='UNDER'">Open settings</button><div style="position:absolute;inset:0;background:#fff"></div></div>
  <a href="#next">Next</a><p style="margin-top:3000px">Far below</p>`);

const live = { STEAL_TEST_LIVE: '1' }; // makes local fixtures count as live sites

// live: anything that looks like it pays, sends or deletes is refused, whatever name the control hides it under
let r = run(['flow', form, '--steps', steps('a', [{ click: 'Place order' }]), '--out', path.join(T, 'f1')], live);
ok('live: flow refuses a pay/order button', r.code === 1 && /refused/.test(read('f1', 'summary.md')), r.out);
r = run(['flow', form, '--steps', steps('b', [{ click: '🗑' }]), '--out', path.join(T, 'f2')], live);
ok('live: flow refuses a destructive aria-label behind an icon', r.code === 1 && /refused/.test(read('f2', 'summary.md')), read('f2', 'summary.md'));
// local: our own wireframes may have Pay / 发布 buttons, and walking them is the whole point
const shop = page('shop.html', `<style>section{display:none}section:target{display:block}</style><a href="#pay">Checkout</a><section id="pay"><button onclick="location.hash='paid'">Pay now</button></section><section id="paid"><h1>Payment received</h1></section>`);
r = run(['flow', shop, '--steps', steps('a2', [{ click: 'Checkout', expect: 'Pay now' }, { click: 'Pay now', expect: 'Payment received' }]), '--out', path.join(T, 'f1b')]);
ok('local: flow clicks a wireframe\'s own Pay button', r.code === 0, read('f1b', 'summary.md'));
const out = page('out.html', `<a href="https://example.com/">Leave</a>`);
r = run(['flow', out, '--steps', steps('a3', [{ goto: 'https://example.com/' }]), '--out', path.join(T, 'f1c')]);
ok('local: flow refuses goto to a live site', r.code === 1 && /can't go to a live site/.test(read('f1c', 'summary.md')), read('f1c', 'summary.md'));
r = run(['flow', out, '--steps', steps('a4', [{ click: 'Leave' }]), '--out', path.join(T, 'f1d')]);
ok('local: flow stops when a link lands on a live site', r.code === 1 && /left the local file/.test(read('f1d', 'summary.md')), read('f1d', 'summary.md'));

// refusals that apply everywhere
r = run(['flow', form, '--steps', steps('c', [{ type: { into: 'Password', text: 'x' } }]), '--out', path.join(T, 'f3')]);
ok('flow refuses password fields', r.code === 1 && /password/.test(read('f3', 'summary.md')), read('f3', 'summary.md'));
r = run(['flow', form, '--steps', steps('d', [{ click: 'Open settings' }]), '--out', path.join(T, 'f4')]);
ok('flow refuses a covered click target', r.code === 1 && /covered/.test(read('f4', 'summary.md')), read('f4', 'summary.md'));
r = run(['flow', form, '--steps', steps('e', [{ click: 'Next', expect: 'Far below' }]), '--out', path.join(T, 'f5')]);
ok('flow expect fails for text that is off screen', r.code === 1 && /isn't/.test(read('f5', 'summary.md')), read('f5', 'summary.md'));
r = run(['flow', form, '--steps', steps('f', {}), '--out', path.join(T, 'f6')]);
ok('flow rejects a steps file that is not a list', r.code === 2, r.out);
r = run(['flow', form, '--steps', steps('g', [{ click: 'Next', type: { into: 'Email', text: 'a' } }]), '--out', path.join(T, 'f7')]);
ok('flow rejects a step with two actions', r.code === 2, r.out);

// live-site refusals
r = run(['flow', form, '--steps', steps('h', [{ click: 'Continue' }]), '--out', path.join(T, 'l1')], live);
ok('live: flow refuses a form submit button', r.code === 1 && /submits a form/.test(read('l1', 'summary.md')), read('l1', 'summary.md'));
r = run(['flow', form, '--steps', steps('i', [{ type: { into: 'Email', text: 'a@b.c' } }, { press: 'Enter' }]), '--out', path.join(T, 'l2')], live);
ok('live: flow refuses Enter inside a form', r.code === 1 && /Enter/.test(read('l2', 'summary.md')), read('l2', 'summary.md'));
r = run(['flow', form, '--steps', steps('j', [{ click: '#icon' }]), '--out', path.join(T, 'l3')], live);
ok('live: flow refuses an unlabelled control', r.code === 1 && /unlabelled/.test(read('l3', 'summary.md')), read('l3', 'summary.md'));

// local wireframe: clicking works and expect passes when the text is on screen
const wf = page('wf.html', `<style>section{display:none}section:target{display:block}</style><a href="#s2">Start</a><section id="s2"><h1>Step two</h1><a href="#s3">Go on</a></section><section id="s3"><h1>Done</h1></section>`);
r = run(['flow', wf, '--steps', steps('k', [{ click: 'Start', expect: 'Step two' }, { click: 'Go on', expect: 'Done' }]), '--out', path.join(T, 'w1')]);
ok('flow walks a local wireframe and passes visible expects', r.code === 0, read('w1', 'summary.md') + r.out);

// clicks land on the innermost matching control; expect sees text split across tags; css: targets
const quiz = page('quiz.html', `<style>section{display:none}section:target{display:block}</style>
  <div class="card" tabindex="0" onclick="location.hash='wrong'"><button onclick="event.stopPropagation();location.hash='right'">Answer A</button></div>
  <section id="right"><h2>C<span>o</span>rr<b>e</b>ct</h2></section><section id="wrong"><h2>Wrapper got it</h2></section>
  <button class="primary" onclick="location.hash='css'">Go</button><section id="css"><h2>Picked by css</h2></section>`);
r = run(['flow', quiz, '--steps', steps('q1', [{ click: 'Answer A', expect: 'Correct' }]), '--out', path.join(T, 'q1')]);
ok('flow clicks the innermost control, not its wrapper; expect reads split text', r.code === 0, read('q1', 'summary.md'));
ok('flow summary shows the screen text and what was clicked', /screen: ".*Correct/.test(read('q1', 'summary.md').replace(/C o rr e ct/, 'Correct')) || /clicked "Answer A"/.test(read('q1', 'summary.md')), read('q1', 'summary.md'));
r = run(['flow', quiz, '--steps', steps('q2', [{ click: 'css:button.primary', expect: 'Picked by css' }]), '--out', path.join(T, 'q2')]);
ok('flow accepts css: targets', r.code === 0, read('q2', 'summary.md'));

// validation and switches
r = run(['flow', form, '--steps', steps('v1', [{ click: '' }]), '--out', path.join(T, 'v1')]);
ok('flow rejects an empty click', r.code === 2 && /empty or invalid/.test(r.out), r.out);
r = run(['flow', form, '--steps', steps('v2', [{ click: 'Next' }]), '--signed-in-ok', 'false', '--out', path.join(T, 'v2')]);
ok('a switch given a value ("--signed-in-ok false") is rejected', r.code === 2 && /takes no value/.test(r.out), r.out);
const clip = page('clip.html', `<a href="#x">Go</a><div style="height:20px;overflow:hidden"><div style="height:200px"></div><p>Clipped away</p></div>`);
r = run(['flow', clip, '--steps', steps('v3', [{ click: 'Go', expect: 'Clipped away' }]), '--out', path.join(T, 'v3')]);
ok('flow expect fails for text clipped by an overflow:hidden parent', r.code === 1, read('v3', 'summary.md'));

// focus: an outline that is there at rest, or a transparent one, is not a focus indicator
const foc = page('foc.html', `<style>button{font-size:16px;padding:14px;margin:4px}.always,.always:focus{outline:2px solid #1d4ed8}.ghost:focus-visible{outline:2px solid transparent}.real:focus-visible{outline:2px solid #1d4ed8}</style>
  <h1>Focus</h1><button class="real">Real ring</button><button class="always">Always ringed</button><button class="ghost">Ghost ring</button>`);
r = run(['check', foc, '--widths', '1440', '--out', path.join(T, 'k1')]);
const k1 = read('k1', 'check.md');
ok('check fails an outline that never changes on focus', /no visible keyboard focus on button "Always ringed"/.test(k1), k1);
ok('check fails a transparent focus outline', /no visible keyboard focus on button "Ghost ring"/.test(k1), k1);
ok('check accepts a real focus ring', !/button "Real ring"/.test(k1), k1);
r = run(['check', page('bad2.html', [1,2,3,4,5,6].map((i) => `<button>${i}</button>`).join('')), '--widths', '1440', '--tabs', '3', '--out', path.join(T, 'k2')]);
ok('check fails when the keyboard walk runs out of budget', r.code === 1 && /stopped after 3 stops/.test(read('k2', 'check.md')), read('k2', 'check.md'));

// capture never clicks
const ok1 = page('ok.html', `<h1>Hello</h1><button onclick="document.title='CLICKED'">OK</button><button onclick="document.title='CLICKED'">Accept all</button>`);
r = run(['style', ok1, '--widths', '1440', '--out', path.join(T, 's1')]);
ok('style clicks nothing (no auto-accept)', r.code === 0 && /ok\.html/.test(read('s1', 'summary.md')) && !/CLICKED/.test(read('s1', 'summary.md')), read('s1', 'summary.md').slice(0, 300));

// check: the false passes the review found
const bad = page('bad.html', `<style>button{margin:4px;padding:12px}button:focus-visible{outline:2px solid #00f}#b9:focus{outline:none}</style>
  ${[1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<button>${i}</button>`).join('')}<button id="b9">nine</button>
  <p style="color:rgba(0,0,0,.45)">Faint text</p><p style="background:linear-gradient(#000,#000);color:#000">Hidden on gradient</p><div style="width:600px;height:10px"></div>`);
r = run(['check', bad, '--out', path.join(T, 'c1')]);
const c1 = read('c1', 'check.md');
ok('check fails a missing focus ring beyond the first eight controls', /no visible keyboard focus on button "nine"/.test(c1), c1);
ok('check fails translucent low-contrast text', /contrast 3\.\d+:1 on "Faint text"/.test(c1), c1);
ok('check flags text on gradients for a visual check', /images or gradients/.test(c1), c1);
ok('check fails horizontal overflow at 390', /390px: horizontal overflow/.test(c1), c1);
ok('check exits 1 on failures', r.code === 1, r.out);
const good = page('good.html', `<style>button{font-size:16px;padding:14px 18px;margin:4px}button:focus-visible{outline:2px solid #1d4ed8}</style><h1>Fine</h1><p>Readable text.</p><button>Save changes</button>`);
r = run(['check', good, '--out', path.join(T, 'c2')]);
ok('check passes a clean page', r.code === 0 && /0 fail/.test(read('c2', 'check.md')), read('c2', 'check.md'));

// map stays put; frames fails loudly
r = run(['map', wf, '--depth', '0', '--out', path.join(T, 'm1')]);
ok('map --depth 0 captures only the start page', r.code === 0 && /^1 pages/m.test(read('m1', 'summary.md')), read('m1', 'summary.md'));
r = run(['map', 'https://example.com', '--profile', '--out', path.join(T, 'm2')]);
ok('map refuses to crawl a live site signed in', r.code === 2 && /never crawls signed in/.test(r.out), r.out);
r = run(['frames', path.join(T, 'missing.mp4'), '--out', path.join(T, 'v1')]);
ok('frames fails on a missing video', r.code !== 0, r.out);

// steal-skill-prototype ships its own copy of capture.mjs; the two must not drift apart
const twin = path.join(path.dirname(CAP), '../../steal-skill-prototype/scripts/capture.mjs');
if (fs.existsSync(twin)) ok('steal-skill-prototype/scripts/capture.mjs is identical (cp it after editing this one)', fs.readFileSync(twin, 'utf8') === fs.readFileSync(CAP, 'utf8'));

const left = fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('steal-capture-')).length;
ok('no temporary browser profiles left behind', left === 0, `${left} left in ${os.tmpdir()}`);
fs.rmSync(T, { recursive: true, force: true });
console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);

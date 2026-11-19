---
title: The warnings from my Claude Code hooks never reached Claude
published: true
description: Hooks that Claude Code wrote for me warned in ways only I could see, and on a slow PC many of them never finished at all. What reaches the model, and how I fixed it.
tags: claudecode, ai, bash, windows
---

## Why I looked into this

Claude Code has hooks: scripts that run at fixed points, such as before a tool call or before Claude ends its reply, to block risky actions or add a warning. I kept asking Claude Code to add hooks for me, and over time I ended up with 86 of them.

At some point I noticed that hook warnings and errors were showing up on my screen, yet Claude carried on as if nothing had happened. The warnings reached me, but apparently not Claude. A warning that only I can see is not much use.

So I checked the official docs to see which hook outputs actually reach Claude, and went back over my own hooks. This post is what I found.

## Setup

- PC: Windows 11, Celeron N4500, 4 GB RAM
- Shell: Git Bash (every hook is a bash script)
- Claude Code: v2.1.327 (the month of logs I looked back over spans v2.1.304 to v2.1.327)
- Hooks: 86
  - 55 PreToolUse hooks. settings.json lists one dispatcher, which runs them at most 8 at a time
  - 17 Stop, 5 SessionStart, 3 UserPromptSubmit, 6 PostToolUse / PostToolUseFailure

Every one of these hooks was written by Claude Code, after I asked it to "stop me when this happens".

## Only four main outputs reach Claude

![Which hook outputs reach Claude](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/claude-code-hook-visibility-fig2-en.png)

According to the official Hooks reference, these are the main hook outputs that reach Claude:

- stderr when the hook exits 2 (except on SessionStart and a few other events)
- `hookSpecificOutput.additionalContext` in JSON output
- the reason given when blocking (`permissionDecisionReason` with deny, `reason` with `decision: "block"`)
- plain stdout from SessionStart and UserPromptSubmit

The ways people tend to write warnings do not reach it:

- **A warning written to stderr with exit 0.** The docs say: "Claude never sees stderr from a hook that exits 0." To read it yourself, they suggest turning on debug logging.
- **A crash with exit 1 or another code, a timeout, or JSON that can't be parsed.** These count as non-blocking errors. On events such as PreToolUse you see a short "hook error" notice, and the action goes ahead.
- **Plain stdout from Stop, PostToolUse and similar events.** Only some events, such as SessionStart and UserPromptSubmit, pass plain stdout to Claude.
- **`systemMessage`.** It is a warning for the user.
- **The reason for an "ask".** It is shown only in the user's permission prompt.
- **exit 2 on SessionStart.** The table in the docs says "Shows stderr to user only".

Many of my hooks followed the pattern "not worth blocking, so print a warning to stderr and exit 0". Left as they were, those warnings went nowhere (apart from the ones my dispatcher already forwarded).

## Not only unseen: the checks were not running

Going back through the session logs, most of the short "hook error" notices on my screen turned out to be hooks that did not finish in time. A hook like that tells Claude nothing, and it also never performs the check it was there for.

From here on I use two words. A **timeout** is when my dispatcher or my wrapper (described below) stops a hook at its own limit (logged as a non-blocking error). A **cancellation** is when Claude Code stops a hook at the limit in settings.json (logged as `hook_cancelled`).

## Example 1: a build-check hook that got slower with every line

![Time per run vs. number of lines](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/claude-code-hook-visibility-fig4-en.png)

Most timeouts came from a single hook. It checks that build and test commands sent to my Raspberry Pi 5 are wrapped in `peakrss`, a small tool that records peak memory.

The hook split the command on `;`, `&&`, `|` and newlines, then ran `sed`, `tr` and `grep` on each piece to find its first word. In Git Bash, starting a program is slow, and each piece started a dozen or so of them.

The chart shows the time for ssh scripts with three commands per line, at different lengths (one run per length). Before the fix, 10 lines took 16 s, 50 lines took 101.5 s, and 200 lines took 292.7 s. In practice my dispatcher stops a hook at 60 s, so somewhere between 25 and 50 lines the check simply stopped happening.

The fix was to do everything after the split with bash builtins only (`[[ =~ ]]`, `BASH_REMATCH`, parameter expansion). 200 lines now take 1.4 s. The rules did not change, and all 47 existing test cases give the same results.

```bash
# before: starts programs for every piece
piece=$(printf '%s' "$piece" | tr -d '"'"'"'`' | sed -E 's/^[[:space:]]+//')

# after: bash only
piece=${piece//[\"\'\`]/}
[[ $piece =~ ^[[:space:]]+(.*)$ ]] && piece=${BASH_REMATCH[1]}
```

## Example 2: the hand-over note at session start rarely arrived

![Hand-over note delivered or cancelled](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/claude-code-hook-visibility-fig3-en.png)

At SessionStart, a hook hands Claude a note from earlier sessions listing what to do next. SessionStart fires not only when a session starts but also when a long session resumes after compaction. This hook had a 10 s limit, and the logs show it was cancelled most of the time at session startup. After compaction, only some runs were cancelled.

My guess is that startup is when the PC is busiest, since Claude Code itself is starting up at the same time. Whenever the note was cancelled, Claude began the session without it.

The other three hooks that run at the same moment (a check for credential files in odd places, a check for tampered agent config, and a disk check on the Raspberry Pi) were also cancelled again and again at their 15 s limit. They stay silent when they find nothing, so when they were cancelled, nothing happened apart from a short notice on my screen.

The causes were starting five hooks at once on a slow PC, and limits that were too short.

## Example 3: 17 Stop hooks starting at once, and crashing

There are 17 Stop hooks. As the docs say, the hooks for one event run in parallel, so all 17 start at once. On a 4 GB PC, Git Bash sometimes failed to create a process, and the logs held errors like these:

```text
child_copy: cygheap read copy failed
/usr/bin/bash: Resource temporarily unavailable
```

Every failure with a readable cause was a failure to start a process (besides the two above: `EUNKNOWN` from `uv_spawn`, and git failing to launch, among others). Many had an empty stderr, so the logs don't say why. Either way they are non-blocking errors: nothing reaches Claude, and there is no telling whether the check ran to the end.

## The fix: one wrapper around every hook

Instead of fixing hooks one by one, I wrote a wrapper, `run-hook.sh`, and put it in front of every hook in settings.json:

```json
{
  "type": "command",
  "command": "bash 'C:/Users/me/.claude/hooks/run-hook.sh' Stop 290 'C:/Users/me/.claude/hooks/block-stop-on-paid-proposal.sh'",
  "timeout": 300
}
```

The wrapper does four things:

1. **Limits how many hooks run at once**: 8 across the whole machine, sharing the slots with the PreToolUse dispatcher
2. **Retries once after a quick crash**: failing to create a process is transient, so it retries only when the hook died within 15 s
3. **If the hook still fails or times out, tells Claude in a way Claude can see**
4. **Turns outputs Claude can't see into ones it can**

For 3 and 4, by kind of output:

- crash or timeout → `additionalContext` saying "this check did not run"
- warning on stderr with exit 0 → into `additionalContext`
- `systemMessage` only → the same text also goes into `additionalContext`
- exit 2 on SessionStart → into `additionalContext`
- plain stdout from Stop or PostToolUse → into `additionalContext`
- exit 2 or a JSON decision → passed through unchanged

The PreToolUse dispatcher got the same treatment, and it now copies the reason for an "ask" into `additionalContext` as well, so Claude knows what I was asked to approve.

The failure report looks like this:

```bash
fail_out() {  # $1 = kind of cause, $2 = reason
  local msg="[$name] HOOK FAILED ($event): $2. This check did not run; do what it would have checked yourself."
  report "$1" && say_json "$msg"   # say_json = {"hookSpecificOutput":{"hookEventName":..,"additionalContext":..}}
  exit 0
}
```

I also raised the limits: Claude Code now gives SessionStart and UserPromptSubmit hooks 60 s and Stop hooks 300 s. The wrapper stops the hook a little before that and reports the timeout itself, because once Claude Code cancels the wrapper, the wrapper can't say anything.

## Once warnings got through, hidden ones showed up

Right after the wrapper went in, warnings that had been invisible started reaching Claude:

- bash's `warning: command substitution: ignored null byte in input`, printed when tool output contains a NUL byte. It is informational only, so the wrapper now drops that one line
- a "no local code" warning that fired every time a script was written to Claude Code's temp folder. That folder is fine to treat like `/tmp`, so it was a false alarm. While excluding it, I also found and closed a hole: a path like `claude/../../Desktop/x.py` could get out of the folder

Only once the warnings arrived could the false alarms be fixed.

## After a Stop notice, the next Stop counts as a continuation

When a Stop hook returns `additionalContext`, the conversation continues, as the docs say. What happens to `stop_hook_active` at the next Stop? The docs only say it is "true when Claude Code is already continuing as a result of a stop hook", so I added a temporary hook that just logs it:

```text
13:38:06 stop_hook_active=absent   <- first Stop (returned additionalContext here)
13:39:41 stop_hook_active=true     <- the Stop after the continuation
```

The `absent` on the first line is an artifact of how I logged it: jq's `.stop_hook_active // "absent"` also returns `absent` when the value is false. From the second line on I used `has()`, and the Stop after the continuation was true. Three of my Stop hooks skipped their check whenever `stop_hook_active` was true, so a single notice from any other hook switched them off for the next stop. I changed them to skip only when they themselves blocked the previous stop. Claude Code also has a cap: after Stop hooks have continued the turn eight times in a row, it ends the turn instead of blocking again. The count resets whenever Claude calls a tool.

## At Stop time, the transcript may not have the final reply yet

The Stop section of the docs had one more thing. The transcript isn't guaranteed to include the final message at Stop time, so hooks should use `last_assistant_message` from the input instead.

All 17 of my Stop hooks read the final reply from the transcript. I logged both with a temporary hook on two stops; they matched both times on my machine, but that is not a guarantee. When I tested with a fake transcript that lagged behind, two hooks really did misjudge:

- the hook that stops Claude from ending its reply with a question to me after an error: it couldn't see the final reply and let it through
- the hook that stops Claude from ending without reporting an error: it blocked a reply that did mention the error

I changed the 12 hooks that read the reply's text to use `last_assistant_message` first.

## What I checked

- Dispatcher: 7 fake-hook cases (crash, crash only on the first try, timeout, ask plus crash, block plus crash, warning only, nothing)
- Wrapper: 26 fake-hook cases
- Build-check hook: 53 test cases (I also fixed a miss on options that take an argument, such as `ssh -i key`)
- The real hooks run together: all 17 Stop hooks finished in 24 s, the 5 SessionStart hooks in 12 s
- In later sessions, ask reasons and PostToolUse warnings did reach Claude

## Wrapping up

In my setup, many of the hooks Claude Code wrote for me warned in ways Claude could not see, and on a slow PC the hooks often didn't finish at all. Either way, all that happened was a short notice on my screen, and Claude carried on without knowing.

For me the biggest surprise was not that warnings went unseen, but that a check that never ran told nobody it hadn't run. I assumed the hooks were looking after me, so I didn't notice.

You can check whether the same thing happens in your setup from the session logs; the appendix shows how.

## Appendix

### Terms

- **PreToolUse / PostToolUse**: hooks that run before / after a tool call
- **Stop**: a hook that runs before Claude ends its reply. Blocking with exit 2 makes Claude keep working
- **SessionStart / UserPromptSubmit**: hooks that run when a session starts / when the user sends a message
- **additionalContext**: text a hook returns in JSON for Claude. It reaches Claude as a system note

### Checking your own setup

Claude Code keeps session logs in `~/.claude/projects/<project>/<session id>.jsonl`, one JSON object per line. Hook results are stored as `attachment` entries, and these three `type` values never reached Claude:

- `hook_non_blocking_error`: non-blocking failure (exit 1, timeout)
- `hook_cancelled`: cancelled by Claude Code
- `hook_system_message`: a `systemMessage` (warning for the user)

To count them by event and hook, I saved this filter as `count.jq`:

```jq
select(.attachment?)
| .attachment
| select(.type == "hook_non_blocking_error" or .type == "hook_cancelled" or .type == "hook_system_message")
| [ .type, (.hookEvent // ""), ((.command // .hookName // "") | split("hooks/") | last) ]
| @tsv
```

```bash
cat ~/.claude/projects/<project>/*.jsonl \
  | jq -r -f count.jq \
  | sort | uniq -c | sort -rn
```

### Caveats

- This is my setup (a slow PC, 86 hooks). On a faster PC or with fewer hooks, I'd expect far fewer timeouts
- A successful run is only logged when the hook printed something, so the logs can't tell you whether a silent hook ran to the end every time
- Hook behavior can change between Claude Code versions. The logs cover v2.1.304 to v2.1.327, the fixes were checked on v2.1.327, and the docs were read on 2026-11-19

### References

- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide)
- Japanese version: [Qiita](https://qiita.com/ussu_ussu_ussu/items/2e2517c6a9fc30f805f4)

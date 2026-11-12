---
title: My Claude Code SessionStart hook sent 305k characters. Almost none of it reached the conversation (the cap is 10,000)
published: true
description: Claude Code caps hook output at 10,000 characters. How I found that my memo-injecting hook had been over the cap as far back as my records go (May), how I checked it, and how I cut it to a one-line-per-project summary.
tags: claude, bash, jq, productivity
---

I run several projects in parallel with Claude Code, and for each one I keep a small file with "what to do next" (I call these files pickups). A SessionStart hook passed all of them to Claude at the start of every conversation.

While cleaning up my PC, I measured how big the pickups had become: about 530 KB. I remembered that hooks have an output limit, so I looked into it.

Short version: a hook can put at most 10,000 characters into the conversation, and my pickups were far beyond that, so almost none of them were reaching the start of the conversation. Here is how I checked it and how I fixed it.

## The setup

A SessionStart hook is a command that runs when a conversation starts. It prints JSON, and the string in `additionalContext` goes into the conversation's context.

The old hook simply concatenated the index and every pickup file (simplified):

```bash
#!/usr/bin/env bash
DIR="$HOME/.claude/memory"
content=$(cat "$DIR/pickup-queue.md")
while IFS= read -r -d '' f; do
  content="$content"$'\n\n'"$(cat "$f")"
done < <(find "$DIR/pickup-queue" -maxdepth 1 -type f -name '*.md' -print0 | sort -z)

printf '%s' "$content" | jq -Rsc '{
  hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: .}
}'
```

## 305k characters sent, only the first 2,000 get in

![305k characters sent, only the first 2,000 get in](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/hookcap_en_2_reach.png)

The official hooks documentation says:

> A hook's `additionalContext`, `systemMessage`, and `initialUserMessage` strings, and its plain stdout, are capped at 10,000 characters

> Claude Code saves the output to a file in the session directory. It replaces the output with the file path and a preview of up to the first 2,000 characters.

> Unlike that Bash ceiling, this cap has no setting or environment variable to raise it.

So once a hook goes over 10,000 characters, the whole output is saved to a file, and the conversation only gets the file path and a preview of up to 2,000 characters. There is no setting to raise the cap.

The full text my old hook tried to send (the index plus 35 pickup files) was 305,295 characters, counted in UTF-16 units. That is about 30 times the cap. The index comes first, so even the preview would only cover the start of the index, never any project's next step.

When I looked back at the start of the conversation where I was doing this investigation, I could not find anything from the pickups, not even a preview. That does not match the documentation (which says a preview is included), and I have not looked into why.

## Over the cap as far back as my records go (May)

![Over 10k characters as far back as my records go](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/hookcap_en_1_history_v2.gif)

To see how long this had been going on, I used the history of the git repository where I back up my settings. For each day I took the last commit and added up the index and pickup files in UTF-16 units:

```bash
git log --format='%h %ad' --date=short | awk '!seen[$2]++' | sort -k2 |
while read h d; do
  files=$(git ls-tree -r --name-only "$h" |
          grep -E '^memory/pickup-queue\.md$|^memory/pickup-queue/[^/]+\.md$')
  [ -z "$files" ] && continue
  chars=$(for f in $files; do git show "$h:$f"; done |
          jq -Rs 'explode | map(if . > 65535 then 2 else 1 end) | add')
  echo "$d $chars"
done
```

On the first day with a backup (May 10) it was already 14,559 characters. Backups before July 7 contain only the index and one pickup file, which is why the chart jumps in July. After that it grew as I added projects, reaching 305,295 characters on November 12.

I have not checked since when Claude Code's cap has been 10,000 characters. So I can't say "it never got through"; I can only say "it was over 10,000 characters for as long as I have records."

## Check 1: count the hook's output in UTF-16

I measured assuming the 10,000 is a JavaScript string length, that is, UTF-16 code units. The documentation does not state the unit, so this is my assumption. Emoji count as 2 in UTF-16, so the number is a bit larger than `jq`'s `length` (code points).

```bash
bash ~/.claude/hooks/inject-pickup-queue.sh |
  jq '.hookSpecificOutput.additionalContext
      | [length, (explode | map(if . > 65535 then 2 else 1 end) | add)]' -c
```

At the time of writing, the old hook (30 pickup files) printed `[275902,276362]`: 275,902 code points, 276,362 UTF-16 units.

Something I learned along the way: Git Bash's `wc -m` counts UTF-16 units (`printf 'a😀b' | wc -m` gives 4). I first assumed it counted code points and had to redo the numbers.

## Check 2: ask a fresh conversation what it can see

Being under the cap does not prove the text actually gets in. I opened a fresh conversation with `claude -p` and asked whether it could see the heading that should be at the top (translated from the Japanese prompt I actually used):

```bash
claude -p "Is there a heading 'Pickup Queue' at the start of this conversation's context? \
If so, copy the first 3 lines starting with '- ' right after it. If not, answer only 'no'. \
Do not use any tools." --max-turns 1
```

With the fixed hook it answered yes and copied back the 3 lines the hook had printed. I did not run this check against the old hook.

## The fix: one line per project instead of the full text

![From the full text to one line per project](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/hookcap_en_4_flow.png)

What the start of a conversation needs is not the full text, but "which projects exist and what is next for each." So the hook now takes one line from each file.

How the line is chosen:

- The first line containing "▶▶" (skipping lines marked as old)
- If that line is just a short heading (under 70 characters), append up to 2 following content lines, skipping headings, horizontal rules and lines marked done, and stopping at the next heading
- If there is no "▶▶", a line with "▶" or "⏳"; failing that, the frontmatter `description`; failing that, the first body line

Lines are sorted by last modified time, newest first, so recently touched projects come first. The full text stays in each file, to be read when I actually work on that project.

The output looks like this (made-up examples):

```text
# Pickup Queue (auto-injected summary)
One "next" line per project, newest first (lines are trimmed). ...

- garden-sensor (11-12): ▶▶ Next: find out why the soil moisture reading jumps at night by swapping the wiring
- recipe-site (11-10): ▶▶ Next: sort search results by rating instead of creation date
- photo-backup (10-21): ⏳ Remaining: check that the first sync finished after replacing the external disk
```

The fitting is done in `jq` (excerpt; `header`, `footer` and `$limit` are defined elsewhere). It tries per-line lengths from 400 characters downward and uses the first one at which the whole output fits the limit, counted in UTF-16. If it still does not fit, it drops the oldest lines and notes how many were dropped.

```jq
def u16: explode | map(if . > 65535 then 2 else 1 end) | add // 0;
def cut($n): if length > $n then .[0:$n] + "…" else . end;
def render($items; $n): header + ($items | map("- " + .s + " (" + .d + "): " + (.t | cut($n))) | join("\n")) + footer;
def omitted($k): if $k > 0 then "\n- (" + ($k|tostring) + " more omitted to fit the cap)" else "" end;
def fit($items; $k): (render($items; 20) + omitted($k)) as $o
  | if ($o | u16) <= $limit or ($items | length) == 0 then $o else fit($items[:-1]; $k + 1) end;

(first((400, 320, 260, 220, 180, 150, 120, 90, 60, 40, 20) as $n
       | render($items; $n) | select(u16 <= $limit))
 // fit($items; 0))
```

I set the limit to 9,500 to leave a margin below 10,000. With 30 pickup files the output is now 8,314 UTF-16 units. It went from 35 files to 30 because I archived 5 finished projects while doing this.

## Starting commands per file came close to the 10 s timeout

![Starting commands per file came close to the 10 s timeout](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/hookcap_en_3_runtime.png)

My first rewrite started `basename`, `date` (twice), `awk` and `tr` for every file. It took 8.5 seconds on my machine. When I had another Claude (Opus) review it, it pointed out that settings.json gives this hook a 10-second timeout. I have not tested what happens past the timeout, but that was cutting it close.

Timing just that loop gave 7.1 seconds (median of 3 runs). That is 30 files × 5 commands = 150 process starts, about 47 ms each. The original "cat everything" version takes 2.6 seconds.

So I changed it so the number of processes does not grow with the number of files:

- `find -printf` gets the modification times and paths in one go
- one `gawk` reads all files (`BEGINFILE` / `ENDFILE` / `nextfile`)
- one `jq` formats and fits the result

```bash
mapfile -t META < <(find "$SECTIONS_DIR" -maxdepth 1 -type f -name '*.md' \
                      -printf '%T@\t%Tm-%Td\t%p\n' | sort -t$'\t' -k1,1nr -k3,3)
FILES=(); for m in "${META[@]}"; do FILES+=("${m##*$'\t'}"); done

printf '%s\n' "${META[@]}" | LC_ALL=C.UTF-8 gawk '
  BEGINFILE {
    if (ERRNO != "") { done = 1; nextfile }   # skip a file that vanished after find
    ...
  }
  FILENAME == "-" { split($0, a, "\t"); day[a[3]] = a[2]; next }   # dates arrive on stdin
  ...
' - "${FILES[@]}" | jq -Rsc '...'
```

That brought it down to 0.46 seconds (median of 3 runs).

Three things I tripped over:

- In `find -printf`, `%TM` is minutes, not month. Month is `%Tm`.
- Unless the locale is UTF-8, `gawk`'s `length` returns bytes ("あいう" gives 9).
- With a `BEGINFILE` rule, `gawk` stops when it cannot open a file and never reads the rest. If a file disappears between `find` and `gawk`, every project after it disappears too. Checking `ERRNO` and skipping fixes that.

## Tests with planted inputs

![The original version passes only 7 of 24 tests](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/hookcap_en_5_tests.png)

The hook has 24 tests. Against the real pickups they check "finishes within 3 seconds", "at most 9,500 UTF-16 units" and "one line per file". The rest use planted inputs in a scratch directory:

- skips old "▶▶" lines / joins a heading-only line with what follows / stops at the next heading
- a body that starts with a `---` rule is not mistaken for frontmatter / reads a folded `description: >`
- ignores `_archive/` / sorts newest first
- bad limit values (`abc`, `10`, `-5`, empty) do not produce empty output
- 150 files with long, emoji-heavy lines still fit the cap, including the last-resort path (dropping the oldest)
- a file vanishing mid-run does not drop the files after it

I also checked that the cap tests are not vacuous: without the cap, the planted 150 files produce about 79k characters. The original version passes only 7 of the 24 tests, and removing just the line that skips a vanished file makes 1 test fail.

## Summary

- Claude Code hooks can put at most 10,000 characters into the conversation. Over that, the whole output goes to a file and the conversation gets at most the first 2,000 characters. There is no setting to raise it.
- My hook sent the full pickup text, which had grown to 305k characters, and it was over 10,000 characters as far back as my records go (May).
- Switching to one line per project, newest first, trimmed to fit in UTF-16, brought it to 8,314, and a fresh conversation confirmed it can see it.
- On Windows Git Bash, starting commands per file came close to the hook's 10-second timeout. One `find`, one `gawk` and one `jq` take 0.46 seconds.

If a hook of yours feeds text into the conversation, measuring its output once tells you whether it is being cut off silently. I had never measured mine.

## Appendix

- Environment: Windows 11, Git Bash (GNU bash 5.2.37), gawk 5.0.0, jq 1.8.1, GNU findutils 4.10.0, Claude Code 2.1.322, Celeron N4500 (4 GB RAM)
- The cap: [Claude Code hooks documentation](https://code.claude.com/docs/en/hooks) (original text checked on 2026-11-12)
- The history chart's counts are the sum of the index and pickup bodies, without the headings the hook adds.
- The documentation does not say whether the 10,000 is UTF-16 units or code points, so I fit to UTF-16, the larger of the two.
- In the real backup history, the paths had a folder named after the PC in front of them for part of the period, and I used those; the code above leaves that out.

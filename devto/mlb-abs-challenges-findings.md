---
title: "ABS Challenges from Triple-A to MLB: Catchers Win Most, and Batters Who Don't Chase Win More"
published: true
description: Every 2026 MLB ABS challenge, pitch by pitch, plus Baseball Savant's boards from Triple-A 2025 to MLB 2026 - who wins ball-strike challenges, and why
tags: baseball, mlb, statcast, datascience
---

In 2026 MLB started the ABS challenge, where a player can dispute a ball/strike call. Watching players tap their helmet or cap on broadcasts, I got curious: who wins these challenges, and where does the gap between good and bad challengers come from?

Triple-A used the same system a year earlier, in 2025, so there are records from before players reached MLB. With the regular season over, I looked at public data from Baseball Savant and MLB StatsAPI. I have no experience working in baseball; I just tallied up public data.

## How ABS challenges work

According to [MLB's announcement](https://www.mlb.com/news/abs-challenge-system-mlb-2026):

- The plate umpire still calls every pitch. **Only the batter, pitcher or catcher** can challenge, and must do so immediately
- Each team has **two** challenges per game; a failed challenge uses one up (a successful one does not)
- Hawk-Eye tracking decides. The zone top is **53.5%** of the player's height (without cleats), the bottom **27%**, measured **over the middle of the plate**

A challenge wins (the call is overturned) when the tracked pitch was on the other side of the call.

## Data

Two sources.

**1. Baseball Savant's ABS challenge boards (per player)**

Savant's [ABS Challenges](https://baseballsavant.mlb.com/leaderboard/abs-challenges) board lists each player's challenges and overturns, plus Savant's expected values: how many times an average player would challenge, and win, given the same opportunities as this player. The page's CSV export has no player id, so I added a function to my package [savant-extras](https://pypi.org/project/savant-extras/) that reads the JSON embedded in the page:

```python
import savant_extras as sx

# MLB 2026 regular-season catcher challenges, including players with none
df = sx.abs_challenges(2026, level="mlb", challenge_type="catcher",
                       game_type="regular", min_challenges=0)
```

I joined 15 boards (MLB and Triple-A; batters, pitchers and catchers; spring and regular season) on the player id, added season stats and Statcast aggregates (chase rate, framing and so on), and published the result on Kaggle ([ABS Challenges: Triple-A 2025 to MLB 2026](https://www.kaggle.com/datasets/yasunorim/mlb-abs-challenges-aaa-2025-to-mlb-2026)). The numbers here are from the final version, after the regular season.

**2. MLB StatsAPI game feeds (pitch by pitch)**

To see what kind of pitches were challenged, you need pitch-level data. In StatsAPI game feeds (`feed/live`, no key needed), a challenged pitch carries `reviewDetails`, so I extracted them from every 2026 regular-season game (2,402 games had a challenge).

There were three traps:

- The pitch's `details.call.description` is the call **after** the review. The original call comes from who challenged (the batting side challenges strikes, the fielding side challenges balls)
- The `count` on a pitch is the count **after** that pitch. The count before it comes from the previous pitch
- **When the final call ends the plate appearance (strikeout or walk), `reviewDetails` sits on the play, not on the pitch.** Reading only the pitch misses all of those

I missed the third one at first, and found it when a breakdown by count said batters' challenges with two strikes won 100% of the time, which cannot be right: every failed challenge that would have ended in a strikeout was missing. Picking up both places in jq (excerpt):

```jq
.liveData.plays.allPlays[] as $p
| ($p.playEvents) as $ev
| (
    # the plate appearance went on: on the pitch
    ( range(0; $ev | length) as $i | select($ev[$i].reviewDetails.reviewType == "MJ")
      | {i: $i, rv: $ev[$i].reviewDetails} ),
    # the plate appearance ended: on the play; the challenged pitch is the last one
    ( select($p.reviewDetails.reviewType == "MJ")
      | ([range(0; $ev | length) | select($ev[.].isPitch == true)] | last) as $li
      | {i: $li, rv: $p.reviewDetails} )
  )
```

I checked the counts against Savant's board totals: 10,557 regular-season challenges, matching exactly, and by challenger 5,612 catcher (Savant 5,613), 4,766 batter (4,765) and 179 pitcher (179). Before fixing the third trap, 2,661 challenges (25%) were missing.

## At every level, catchers win the most challenges

![At every level, catchers win the most challenges](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_1_share.png)

In the 2026 MLB regular season, catchers won 58.6% of 5,613 challenges, batters 48.9% of 4,765 and pitchers 39.7% of 179. Triple-A has the same order, with a 13-point gap between catchers and batters in 2026.

Pitchers rarely challenge; on the fielding side it is almost entirely the catcher's job.

Triple-A catchers went from 53.7% in 2025 to 57.9% in 2026. Batters stayed at 45% both years.

## Why do catchers win more?

Catchers win 10 points more often than batters. Is it because they judge the calls better? I looked at what kind of pitches were challenged.

From the StatsAPI coordinates I computed how far the ball's surface was from the zone edge, and split challenges into three groups:

- **Call looks clearly wrong:** at least an inch on the other side of the call (for example, a ball call on a pitch an inch or more inside the zone)
- **Within an inch of the edge**
- **Call looks right:** at least an inch on the called side

This is my own zone, and it differs from the ABS call near the edge (see the appendix). But pitches an inch or more from the edge were called "as they look" about 98% of the time or more, for catchers and batters alike, so the two outer groups are largely reliable.

![Catchers pick pitches whose call looks clearly wrong](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_6_clarity.png)

38% of catchers' challenges were on pitches whose call looks clearly wrong, against 21% of batters'. The other way round, 16% of catchers' challenges were on calls that look right, against 36% of batters'.

I also swapped only the mix of pitches, keeping each group's win rate. If batters chose pitches in the catchers' mix, they would win 67.4%, more than catchers actually do (58.6%). If catchers chose in the batters' mix, they would win 40.7%. Either way, **the difference in mix alone opens a gap bigger than the actual 10 points** between catchers and batters. Most of the catchers' edge seems to come from choosing more pitches whose call looks clearly wrong. Catchers receive the ball in their mitt and see its location closest, which may make those pitches easier to pick.

On the hard pitches within an inch of the edge, batters won 64% and catchers only 46%. That group, though, is where my zone's error matters most (appendix), so I cannot say batters are better at judging the hard ones.

So why do batters challenge calls that look right? I looked at the situations.

![With two strikes, batters' challenges win less often](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_7_strikes.png)

By strikes before the pitch, batters won 59% with no strikes and 40% with two. Catchers won 61%, 62% and 53%, a smaller drop.

![A third of batters' challenges dispute a called strike three](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_8_strike3.png)

A called strike with two strikes is strike three if it stands. 34% of batters' challenges came in that spot (the same 1,619 challenges as the two-strike point above), and 40% won, 13.5 points below their challenges of other strike calls (53%).

45% of the strike-three challenges were on pitches whose call looks right (32% for other strike calls). When a strikeout is on the line, batters challenge more long shots.

![Late in the game, challenges win less often](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_9_inning.png)

Late in the game, from the 9th inning on, both catchers and batters won less often. The share of catchers' challenges on calls that look right rose from 13% in innings 1 to 6 to 28% from the 9th on.

This data alone does not say why. Unused challenges disappear at the end of the game, so teams may spend what is left; or late innings hold more high-leverage spots, where even a long shot is worth a challenge.

## Among catchers, the share won ranges from 47% to 81%

![Among catchers, the share won ranges from 47% to 81%](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_2_catchers.png)

These are the 44 MLB catchers with 60+ challenges in 2026. J.T. Realmuto won 70 of 86 (81%); Francisco Alvarez won 42 of 90 (47%).

Savant's expected values say how many times an average player would challenge, and win, given the same opportunities. Realmuto's expected challenge count was 138; he made 86, about 40% fewer than an average catcher. He may have saved them for pitches likely to win. Alvarez made 90 against an expected 81, a little more than average. Salvador Perez, second at 46 of 65 (71%), made exactly as many challenges as expected (65).

With 60 to 90 challenges per catcher, chance is not small. Using the catchers' overall 58.6%, the binomial probability of winning 70 or more of 86 is below 1 in 100,000, and about 0.03% that any of 44 catchers would. Realmuto is hard to explain by chance. Winning 42 or fewer of 90 has a probability of 1.5%, or 49% that at least one of 44 catchers would; Alvarez's low number is well within what chance produces.

Across the 44, catchers who challenged less than expected tended to win more often (Spearman −0.26, p = 0.09), but the trend is not clear.

## Batters who chase less win more challenges

![Batters who chase less win more challenges](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_3_chase.png)

I split the 465 MLB batters with 100+ plate appearances in Statcast into thirds by chase rate (swings at pitches outside the zone). From the least to the most chasing, they won 51.3%, 48.0% and 45.7% of their challenges. Among the 182 with 10+ challenges, the rank correlation between chase rate and share won is −0.20 (p = 0.008).

Do batters with a good eye judge calls better? As with catchers, I split their challenges into the three groups (4,603 challenges from the three thirds):

- Challenges of calls that look right: 33% for the least chasing third, 37% in the middle, 39% for the most chasing
- Challenges of calls that look clearly wrong: 22%, 21%, 19%
- Win rates within each group are about the same across the thirds (63% to 64% within an inch of the edge)

So the difference is that batters who chase less challenge fewer calls that look right and slightly more that look clearly wrong. There is no clear difference in judging the hard pitches near the edge.

How **often** a batter challenges is nearly unrelated to chase rate (Spearman −0.04, 465 batters).

By name, Taylor Ward, with the lowest chase rate (15%), won 8 of 15 (53%); Ceddanne Rafaela, with the highest (45%), won 6 of 24 (25%).

## Stealing strikes and winning challenges are different skills

![Stealing strikes and winning challenges are different skills](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_4_framing.png)

Catchers can make balls look like strikes: framing. Savant's official framing is MLB-only, so I computed, per catcher from pitch-level Statcast, the share of out-of-zone takes called strikes. That works in Triple-A too.

As the left panel shows, in MLB 2026 it has a rank correlation of 0.83 with official framing runs (56 catchers), good enough as a stand-in (Triple-A has no official number, so I cannot check the fit there).

But it is almost unrelated to challenge skill (Savant's challenges vs expected, see the appendix), as the right panel shows: 0.03 in MLB 2026, 0.08 in Triple-A 2026 and 0.14 in Triple-A 2025, none significant. Making a ball look like a strike and spotting a wrong call worth disputing seem to be different skills.

## What carries up from Triple-A is how often a player challenges

![What carries up from Triple-A is how often a player challenges](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs_en_5_carry.png)

I compared the same players in Triple-A 2025 and MLB 2026 (63 batters and 51 catchers with 5+ challenges in both):

- **How often** they challenge carries over clearly (Spearman 0.37 for batters, 0.45 for catchers)
- **Share won** carries over for batters (0.32, p = 0.01); for catchers it is 0.24 (p = 0.10)
- Savant's **challenges vs expected** (the net against an average player given the same opportunities) does not: 0.05 for batters and 0.21 for catchers, neither clear

Chase rate itself carries over strongly (0.68). As in the previous section, batters who chase less challenge fewer calls that look right, so the carry-over in share won may come from there (I did not check this). For example, Gary Sánchez challenged at 16% in Triple-A 2025 (7 challenges) and 16% in MLB 2026 (37).

## No clear age difference

Split into four age groups, MLB 2026 batters aged 34 and over won 54.2%, higher than the rest. But that is 34 batters and 334 challenges, and the interval (48.8% to 59.5%) overlaps the other groups. Savant's challenges vs expected per batter is −0.23 for 25 and under, +0.29 for 26 to 29, −0.30 for 30 to 33 and +0.73 for 34 and over, with no ordering by age. There is no clear age effect.

## Summary

In this data:

- At both MLB and Triple-A, catchers win the most challenges (58.6% in MLB 2026, batters 48.9%)
- Most of that gap seems to come from catchers choosing more pitches whose call looks clearly wrong (38% vs 21%). Batters challenge more calls that look right with two strikes, especially on called strike three
- Late in the game, more challenges go to calls that look right, and fewer win
- Catchers differ a lot: Realmuto challenged about 40% less than expected and won 70 of 86
- Batters who chase less win more, because they challenge fewer calls that look right and slightly more that look clearly wrong
- Framing and challenge skill are different things
- What carries from Triple-A to MLB is how often a player challenges; whether skill carries is unclear

## Appendix

**Terms**

- Expected values (Savant): how many times an average player would challenge (`exp_chal`) and win (`exp_chal_gained`) given the same opportunities as this player. They are not computed for the pitches the player chose. "Challenges vs expected" here is Savant's `overturns_vs_exp`: the net of overturns and failures against expectation, minus the same for challenges made against the player's side. It mixes how often and how well a player challenges
- Challenge rate: challenges ÷ the opportunities Savant counts for the player (`n_total_sample`)
- Chase rate: share of pitches outside the zone that the batter swung at (Statcast)
- Rank correlation: Spearman's

**Caveats**

- Everything here is correlation, not causation
- The "distance from the zone edge" in the pitch-level sections is my own, from StatsAPI coordinates (measured at the front of the plate) and the zone top and bottom in StatsAPI. The zone top and bottom were constant per batter in 2026, but ABS judges over the middle of the plate, so my zone differs from the actual call near the edge. Within an inch of my edge, 64% of batters' and 46% of catchers' challenges were overturned, so the error may lean against catchers. An inch or more from the edge, 97.9% to 99.7% of calls went the way they look
- Individual players' shares swing a lot with few challenges. The named players' numbers are one season's results

**Data and code**

- Dataset: https://www.kaggle.com/datasets/yasunorim/mlb-abs-challenges-aaa-2025-to-mlb-2026 (DOI: [10.34740/kaggle/dsv/20077454](https://doi.org/10.34740/kaggle/dsv/20077454))
- Notebook: [ABS Challenges: Who Wins Them, AAA to MLB](https://www.kaggle.com/code/yasunorim/abs-challenges-who-wins-them-aaa-to-mlb)
- Build code: https://github.com/yasumorishima/kaggle-datasets (`abs-challenges-dataset/`)
- Sources: Baseball Savant / MLB StatsAPI (MLB Advanced Media)
- Japanese version: [Qiita](https://qiita.com/ussu_ussu_ussu/items/57c5760b3f9917b3883f)

*Rewritten on 2026-09-30 with pitch-level data for the full regular season. An earlier version described Savant's expected values as accounting for the difficulty of the challenged pitches, and said older batters were below expected; Savant's expected values are for an average player given the same opportunities, and that "below expected" figure mixed two denominators.*

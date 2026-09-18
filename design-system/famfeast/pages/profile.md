# Profile Page Overrides

> **PROJECT:** FamFeast
> **Page Type:** Profile & Household
> Follow `pages/implementation.md` Hearth & Table tokens, not MASTER.md.

## Layout

Stitch household profile, stacked on a `#F8F9FF` canvas:

1. Household banner (name, invite, vibe + sync)
2. Active chef card (avatar, role, streak, stats bento)
3. Household crew list
4. Taste & dietary rules
5. Kitchen habits & rules
6. Integrations / shortcuts
7. Switch household + sign out

Screen margins `20px`. Card radius `24px`. Section gap `20px`. Phosphor icons only — no emoji as structural icons.

## Interactions

- Invite copies the weekly share link.
- Crew row switches the active member; editors can open member edit from the featured card.
- Toggles persist on the household record.
- Sign out returns to onboarding.

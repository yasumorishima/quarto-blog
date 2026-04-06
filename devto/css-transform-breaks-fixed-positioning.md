---
title: "transform: translateY(0) Breaks position: fixed — A Hidden Trap in SPA Animations"
published: true
description: Why translateY(0) and transform none are not the same, and how this CSS spec detail silently breaks every fixed overlay on your page.
tags: css, nextjs, react, webdev
canonical_url:
---

## The Bug

One day I got this bug report on my Next.js site:

> Clicking a photo near the bottom of the gallery opens a lightbox, but it's completely black. Scroll up and the image is there.

A `position: fixed; inset: 0` overlay was not covering the viewport — it was stuck at the top of the page. Browser bug? No. This is CSS working exactly as specified.

## How to Reproduce

Two ingredients:

1. **An ancestor element with `transform` set** (even `translateY(0)`)
2. **A descendant with `position: fixed`**

```css
/* Page transition animation */
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0); /* The culprit */
  }
}

.page-enter {
  animation: page-enter 0.35s ease both; /* both = keeps final values */
}
```

```tsx
// Lightbox (descendant of .page-enter)
<div className="fixed inset-0 z-50 bg-black/90">
  <img src={photo.url} />
</div>
```

Near the top of the page, everything looks fine. Scroll down and open the lightbox — it renders at the **top of the ancestor element**, not the viewport.

## Why This Happens — The CSS Spec

From [MDN's `position: fixed` documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/position#fixed):

> The element is positioned relative to the initial containing block established by the viewport, **except when one of its ancestors has a `transform`, `perspective`, or `filter` property set to something other than `none`**.

| Ancestor's `transform` | `fixed` is relative to |
|---|---|
| `none` or unset | **viewport** (expected) |
| `translateY(0)` | **that ancestor** (broken) |
| `translateY(12px)` | **that ancestor** (broken) |

**`translateY(0)` is not the same as no transform.** It's a transform that moves nothing — but the CSS engine still creates a new containing block.

## The `animation-fill-mode: both` Trap

```css
.page-enter {
  animation: page-enter 0.35s ease both;
}
```

`both` (`forwards` + `backwards`) keeps the final keyframe values **after the animation ends**. So `transform: translateY(0)` persists for the lifetime of the element.

The same applies to JavaScript inline styles:

```tsx
// IntersectionObserver fadeIn component
<div style={{
  transform: visible ? "translateY(0)" : "translateY(16px)",
  // After visible=true, translateY(0) stays forever
}}>
  {children}
</div>
```

## Blast Radius

**Every `fixed` descendant** of a `transform`-bearing ancestor is affected:

- Lightboxes / modals
- Toast notifications
- Cookie consent banners
- PWA install prompts
- Progress bars
- Scroll-to-top buttons

Bottom navs and sticky headers may not visibly break (they sit at viewport edges), but they are technically affected too.

## The Fix

### 1. Use `transform: none` (Most Important)

```css
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none; /* Not translateY(0) */
  }
}
```

```tsx
<div style={{
  transform: visible ? "none" : "translateY(16px)",
}}>
```

`transform: none` means "no transform is applied" — no containing block is created.

### 2. Use `createPortal` to Escape the DOM Tree (Defensive)

```tsx
import { createPortal } from "react-dom";

function Lightbox() {
  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/90">
      {/* ... */}
    </div>,
    document.body // Renders at body root — immune to ancestor CSS
  );
}
```

No matter what ancestors do, the overlay is not affected. This is a best practice for any viewport-covering overlay.

### 3. Do Both (Recommended)

Fix the root cause with `transform: none`, and add `createPortal` as defense-in-depth. If someone later adds a new `transform` ancestor, overlays still work.

## Summary

| Don't | Do |
|---|---|
| Use `translateY(0)` as animation end value | Use `transform: none` |
| Render `fixed` overlays deep in the DOM tree | Use `createPortal(document.body)` |
| Add animations without checking `fixed` elements | Audit `fixed` descendants when adding `transform` |

**`translateY(0)` and `none` look identical but behave differently.** Miss this spec detail and every overlay on your site breaks the moment you add a page transition animation.

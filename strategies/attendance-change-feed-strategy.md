# Attendance Change Feed Strategy

## Objective

Add a persistent, rolling attendance change feed to the Reports page so authenticated users can quickly see recent attendance edits that matter for copying data into an external system.

The feed should:

- be visible to users of any role who can access Reports
- use the same timeline-style layout pattern as the Feedback feed
- persist between sessions because it is generated and stored on the server
- automatically ignore changes too far in the future
- automatically clean up changes that are no longer relevant

## Product Rules

- Calendar and Reports remain viewable by all authenticated users.
- The new feed is read-only.
- The first version tracks attendance availability changes.
- Changes are only shown when the affected attendance date is within the actionable copy-forward window.
- Changes for past dates can be cleaned up automatically.

## Recommended Cutoff Rule

Use a default cutoff of **13 days**.

Why:

- data is copied on Monday or Tuesday
- that copy is for the following full week
- from Monday, the end of the following week is 13 days away

Visibility rule:

- show a feed item when the affected date is from today through today plus 13 days
- do not show feed items for dates beyond that cutoff

## Architecture

### Database

Add a dedicated append-only table for feed items, for example `attendance_change_feed`.

Recommended columns:

- change_id
- subject_user_id
- actor_user_id
- date
- wave
- previous_available
- next_available
- action
- created_at
- expires_at

Also add a project-wide admin setting for the cutoff, defaulting to 13.

### Worker

Generate feed rows inside the attendance save route.

Why this is the best hook:

- it already knows the authenticated actor
- it is the real persistence boundary
- it keeps the audit trail durable across sessions and devices

Implementation notes:

- read the current stored value before saving
- only write a feed row when the value actually changes
- classify the action as created, updated, or cleared
- set an expiry time so old items can be pruned
- prune expired rows during feed reads and writes

### API

Add a read-only endpoint under the Reports routes to return recent feed items.

The endpoint should:

- require authentication only
- return newest-first items
- join user names and images for display
- filter to the active rolling window

### Frontend

Add a new Reports feed section below the main report area.

Recommended structure:

- a small hook to load feed items
- a feed container component with loading, error, and empty states
- a feed item component that mirrors the Feedback timeline layout

Styling should use TailwindCSS plus the existing project theme utilities such as the `ui-*` classes.

## Pros, Cons, Confidence

### Option 1: Separate audit table in D1 (recommended)

**Pros**

- persistent and reliable
- survives refreshes and session changes
- supports cleanup cleanly
- best match for the current Worker architecture

**Cons**

- requires a migration and a little extra Worker logic

**Confidence**

- High

### Option 2: Infer the feed from current attendance rows

**Pros**

- less initial code

**Cons**

- not a true history
- cannot track clears or older state reliably

**Confidence**

- Low

## Implementation Sequence

1. Save this strategy in the strategies folder.
2. Add the new database migration and bootstrap schema updates.
3. Add Worker-side audit recording in the attendance save route.
4. Add the read-only Reports feed endpoint.
5. Add shared feed types.
6. Build the Reports feed UI using the Feedback layout pattern.
7. Verify with lint and build.

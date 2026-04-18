# Calendar Admin Multi-Select Strategy

## Objective

Implement admin-only multi-day selection on the calendar page with a custom context menu for bulk calendar_info updates, while keeping availability editing behavior intact. Enforce access and value constraints in UI, API, and database layers.

## Product Rules

- Multi-day selection is admin-only.
- Opening the context menu is admin-only.
- calendar_info updates are admin-only.
- nights is a toggle (0/1).
- priority is a toggle (0/1).
- type is restricted to PTT or ACT.
- Context menu and buttons use Tailwind CSS and match existing project styling patterns.

## Interaction Model

-
- Desktop:
  - Single click selects one day.
  - Ctrl/Cmd click toggles individual day selection.
  - Shift click selects inclusive date range from anchor.
  - Right-click on an unselected day replaces selection with that day, then opens menu.
- Mobile:
  - Long-press opens the same context action menu.
- Non-admin:
  - No multi-select behavior.
  - No context menu behavior.
  - Calendar remains read-only for calendar_info actions.

## Frontend Implementation

- Calendar component owns:
  - selected date set
  - selection anchor
  - context menu position/open state
  - calendar_info action loading state
- Day cell component receives:
  - selected-state flag
  - click/context handlers (admin only)
- Context menu actions:
  - Toggle nights
  - Toggle priority
  - Set type to PTT
  - Set type to ACT
- Save flow:
  - Build batched calendar_info changes from selected dates
  - POST to /api/calendar-info/save
  - Merge saved values into local map on success

## Backend Implementation

- Add POST /api/calendar-info/save in calendar routes.
- Require authenticated session and admin role.
- Reject non-admin with 403.
- Validate each change:
  - date format YYYY-MM-DD
  - nights in {0,1}
  - priority in {0,1}
  - type in {PTT, ACT}
- Batch upsert by (user_id, date).

## Database Rollout (No Reset)

- Use forward-only migration for existing databases.
- Do not use database reset to ship this feature.
- Add migration:
  - normalize existing legacy type values to ACT when outside {PTT, ACT}
  - rebuild calendar_info table with CHECK(type IN ('PTT', 'ACT'))
- Update bootstrap files for fresh environments:
  - add the same CHECK constraint
  - keep seed data compliant with PTT/ACT-only domain

## Verification

- Admin desktop:
  - selection rules and right-click behavior
  - context menu actions persist correctly
- Admin mobile:
  - long-press opens actions and saves correctly
- Non-admin:
  - cannot select/open context actions
  - direct API call to /api/calendar-info/save returns 403
- Data integrity:
  - API rejects type outside PTT/ACT
  - DB constraint blocks invalid type writes
- Rollout checks:
  - migration succeeds on populated DB without data loss
  - fresh bootstrap DB matches expected final schema
- Regression:
  - existing availability save/edit behavior still works

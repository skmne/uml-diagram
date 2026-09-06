# Changelog

## Unreleased

- Add the instance option `highlightIncidentLinksOnClick` (default `false`) to include incoming/outgoing links when clicking a class; enable it explicitly in basic usage.
- Select nodes/links by clicking; Shift+click toggles items in a mixed selection (`highlightChanged` reason `click`).
- Add opt-in automatic highlighting through `addItems(data, { highlight: true })` or an `AddItemsOptions` instance.
- Emit node movement/layout events only for actual node dragging, not a plain node click.
- Add `setHighlight`, `clearHighlight`, `getHighlight` and `highlightChanged` for temporary node/link selection.
- Support directed relationship identities, incident links, configurable theme colors and stroke width, redraw persistence and removal pruning.
- Clear only on plain empty-canvas clicks; preserve highlights during dragging, panning and zooming.
- Isolate highlighted arrow markers and restore normal item styles when cleared.
- Export a detached SVG copy without temporary highlights or on-screen mutations.
- Remove VS Code-specific drag stroke overrides.
- Extend basic usage with add-and-highlight and external class selection, plus unit and Chrome browser tests.

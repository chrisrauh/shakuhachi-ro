# Chrome DevTools MCP recipes

Call patterns for visual checks with chrome-devtools-mcp. Local terminal only — the cloud uses a Playwright script instead. Setup and the stale-process fix are in [ENVIRONMENT-LOCAL.md](./ENVIRONMENT-LOCAL.md); the dev server is in [CLAUDE.md](../CLAUDE.md#dev-server).

## Visual Verification Patterns

**For styling/layout work:**

```
navigate_page({ url: "http://localhost:PORT/path" })
emulate({ colorScheme: "light" })
take_screenshot()
emulate({ colorScheme: "dark" })
take_screenshot()
take_snapshot()
list_console_messages()
```

**For refactors (verify nothing changed):**

```
# Before changes
navigate_page({ url: "http://localhost:PORT/path" })
take_screenshot()

# After changes
navigate_page({ type: "reload" })
take_screenshot()
emulate({ colorScheme: "dark" })
take_screenshot()
list_console_messages()
```

## Element-Specific Debugging

```
take_snapshot({ verbose: false })              // Get element tree with UIDs
take_screenshot({ uid: "element-uid" })        // Screenshot specific element
evaluate_script({
  function: "(el) => ({ bounds: el.getBoundingClientRect(), styles: window.getComputedStyle(el) })",
  args: [{ uid: "element-uid" }]
})
```

## Performance Profiling

```
navigate_page({ url: "http://localhost:PORT/score/akatombo" })
performance_start_trace({ reload: true, autoStop: true })
performance_analyze_insight({ insightSetId: "...", insightName: "LCPBreakdown" })
performance_stop_trace({ filePath: "traces/score-rendering.json.gz" })  // Optional
```

## Multi-Viewport Testing

```
emulate({ viewport: { width: 1280, height: 720, deviceScaleFactor: 1 } })                              // Desktop
emulate({ viewport: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true } })              // Tablet
emulate({ viewport: { width: 375, height: 667, deviceScaleFactor: 3, isMobile: true, hasTouch: true } }) // Mobile
```

## Debugging Visual Issues

```
take_screenshot()
take_snapshot({ verbose: true })
list_console_messages({ types: ["error", "warn"] })
list_network_requests({ resourceTypes: ["xhr", "fetch"] })
get_network_request({ reqid: 123 })
evaluate_script({ function: "() => ({ scoreData: window.__SCORE_DATA__, renderState: window.__RENDER_STATE__ })" })
```

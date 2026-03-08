# Embedding the Calendar Widget

The CYH Calendar embed is a single JavaScript file that organizations can add to their websites. It renders a fully themed calendar within a Shadow DOM, ensuring it won't conflict with the host site's styles.

## Quick Start

Add this to your website's HTML:

```html
<div id="cyh-calendar"></div>
<script src="https://casperevents.org/embed.js"></script>
<script>
  CYHCalendar.init({
    container: '#cyh-calendar',
    orgId: 'YOUR_ORG_ID',
    showConnectedOrgs: true,
    theme: {
      primaryColor: '#2563eb',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#f59e0b',
      borderRadius: '8px'
    },
    defaultView: 'month'
  });
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string | (required) | CSS selector for the container element |
| `orgId` | string | (required) | Your organization ID |
| `apiUrl` | string | auto | API base URL (auto-detected from script src) |
| `showConnectedOrgs` | boolean | `true` | Include events from connected organizations |
| `ctaOpensExternal` | boolean | `false` | When true, poster CTA opens external URL directly instead of event detail |
| `theme` | object | defaults | Color and style customization |
| `defaultView` | string | `"month"` | Initial view: `"month"`, `"week"`, `"list"`, or `"poster"` |
| `hiddenCategories` | string[] | `[]` | Category slugs to hide from the calendar |
| `layoutDensity` | string | `"comfortable"` | `"compact"` or `"comfortable"` |
| `firstDayOfWeek` | string | `"sunday"` | `"sunday"` or `"monday"` |
| `timeFormat` | string | `"12h"` | `"12h"` or `"24h"` |
| `maxEventsShown` | number \| null | `null` | Limit events in list/poster views (e.g. 10, 25, 50). Omit for all |
| `showEventImages` | boolean | `true` | Show event images in list and poster views |
| `showVenue` | boolean | `true` | Show venue/address |
| `showOrganizer` | boolean | `true` | Show organization name |
| `showCategories` | boolean | `true` | Show category badges |
| `showTicketLink` | boolean | `true` | Show ticket URL button |
| `showCost` | boolean | `true` | Show cost field |
| `headerTitle` | string | `"Events"` | Custom header title |
| `showHeader` | boolean | `true` | Show/hide header bar |
| `showPoweredBy` | boolean | `true` | Show "Powered by Casper Events" footer |

## Theme Options

| Property | Default | Description |
|----------|---------|-------------|
| `primaryColor` | `#2563eb` | Main accent color (buttons, links, highlights) |
| `secondaryColor` | `#64748b` | Secondary buttons, muted elements |
| `backgroundColor` | `#ffffff` | Widget background color |
| `textColor` | `#1f2937` | Primary text color |
| `accentColor` | `#f59e0b` | Secondary accent (category badges, dates) |
| `fontFamily` | `inherit` | Font stack (inherits from host page by default) |
| `borderRadius` | `8px` | Corner radius for cards and buttons. Presets: `0`, `4px`, `8px`, `12px`, `999px` |
| `borderColor` | derived | Custom border color (default: derived from text) |
| `headerBgColor` | inherit | Optional header background color |
| `linkColor` | primary | Override link color (default: primary) |
| `boxShadow` | `"subtle"` | `"none"`, `"subtle"`, or `"medium"` |

## Responsive Behavior

The widget is fully responsive:
- **Full width (600px+)**: Full month grid with event previews
- **Narrow (300-600px)**: Compact month grid with dot indicators
- **Sidebar (< 300px)**: Automatically switches to list view

## Examples

### Match a dark-themed site

```javascript
CYHCalendar.init({
  container: '#calendar',
  orgId: 'abc123',
  theme: {
    primaryColor: '#818cf8',
    backgroundColor: '#1e1e2e',
    textColor: '#e2e8f0',
    accentColor: '#fbbf24',
    borderRadius: '12px'
  }
});
```

### Hide specific categories

```javascript
CYHCalendar.init({
  container: '#youth-calendar',
  orgId: 'abc123',
  hiddenCategories: ['internal', 'staff-only'],
  defaultView: 'list'
});
```

### Compact layout with 24-hour time

```javascript
CYHCalendar.init({
  container: '#sidebar-calendar',
  orgId: 'abc123',
  layoutDensity: 'compact',
  firstDayOfWeek: 'monday',
  timeFormat: '24h',
  maxEventsShown: 10
});
```

### Multiple calendars on one page

```html
<div id="main-calendar"></div>
<div id="sidebar-calendar"></div>

<script src="https://casperevents.org/embed.js"></script>
<script>
  CYHCalendar.init({
    container: '#main-calendar',
    orgId: 'org1',
    defaultView: 'month'
  });

  CYHCalendar.init({
    container: '#sidebar-calendar',
    orgId: 'org2',
    defaultView: 'list',
    theme: { primaryColor: '#059669' }
  });
</script>
```

## Cleanup

To remove an embedded calendar:

```javascript
CYHCalendar.destroy('#cyh-calendar');
```

## Finding Your Organization ID

Your Organization ID is displayed in your dashboard at Settings > Embed Settings. You can also find it in the auto-generated embed code snippet.

## WordPress Integration

For WordPress sites, add the embed code to a Custom HTML block in the page editor.

## Squarespace / Wix

Use a custom HTML/code embed block and paste the full embed snippet.

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
} from "date-fns";
import type { EmbedEvent } from "../types";

interface PrintOptions {
  currentDate: Date;
  events: EmbedEvent[];
  primaryColor?: string;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function printEmbedCalendar({ currentDate, events, primaryColor = "#4f46e5" }: PrintOptions) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const monthLabel = format(currentDate, "MMMM yyyy");

  const eventsByDate = new Map<string, EmbedEvent[]>();
  for (const ev of events) {
    const key = format(parseISO(ev.startAt), "yyyy-MM-dd");
    const list = eventsByDate.get(key) ?? [];
    list.push(ev);
    eventsByDate.set(key, list);
  }

  const fmtTime = (iso: string, allDay?: boolean) => {
    if (allDay) return "All Day";
    return format(parseISO(iso), "h:mm a");
  };

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const DAY_HEADERS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const tableRows = weeks.map((week) => {
    const cells = week.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const dayEvents = eventsByDate.get(key) ?? [];
      const inMonth = isSameMonth(day, currentDate);
      const evHtml = dayEvents.map((ev) => {
        const time = fmtTime(ev.startAt, ev.allDay);
        const loc = ev.venueName || ev.address || "";
        const dot = ev.categories[0]?.color || primaryColor;
        return `<div class="ev"><span class="dot" style="background:${esc(dot)}"></span><div class="eb"><div class="et">${esc(ev.title)}</div><div class="em">${esc(time)}${loc ? ` &middot; ${esc(loc)}` : ""}</div></div></div>`;
      }).join("");
      return `<td class="dc${!inMonth ? " out" : ""}"><div class="dn">${format(day, "d")}</div>${evHtml}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  const monthEvents = events
    .filter((e) => { const d = parseISO(e.startAt); return d >= monthStart && d <= monthEnd; })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const sidebarHtml = monthEvents.map((ev) => {
    const date = format(parseISO(ev.startAt), "EEE, MMM d");
    const time = fmtTime(ev.startAt, ev.allDay);
    const loc = ev.venueName || ev.address || "";
    const cost = ev.cost || "Free";
    const dot = ev.categories[0]?.color || primaryColor;
    return `<div class="se"><div class="sd" style="background:${esc(dot)}"></div><div><div class="st">${esc(ev.title)}</div><div class="sm">${esc(date)} &middot; ${esc(time)}</div>${loc ? `<div class="sm">${esc(loc)}</div>` : ""}<div class="sm">${esc(cost)}</div></div></div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Community Calendar – ${esc(monthLabel)}</title>
<style>
@page{size:landscape;margin:.4in}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:3px solid ${primaryColor}}
.hdr h1{font-size:22px;font-weight:800;letter-spacing:-.02em}
.hdr .mo{font-size:22px;font-weight:800;color:${primaryColor}}
.lay{display:flex;gap:14px}
.cal{flex:1;min-width:0}
.sb{width:215px;flex-shrink:0;border-left:2px solid #e5e7eb;padding-left:12px}
.sb h3{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#666;margin-bottom:8px}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th{padding:5px 3px;text-align:center;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#fff;background:${primaryColor}}
th:first-child{border-radius:6px 0 0 0}th:last-child{border-radius:0 6px 0 0}
.dc{border:1px solid #e5e7eb;vertical-align:top;padding:2px 3px;height:80px;overflow:hidden}
.dc.out{background:#f9fafb}.dc.out .dn{color:#ccc}
.dn{font-size:11px;font-weight:700;color:#333;margin-bottom:1px}
.ev{display:flex;align-items:flex-start;gap:3px;margin-bottom:2px;line-height:1.2}
.dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:3px}
.eb{min-width:0;overflow:hidden}
.et{font-size:7.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.em{font-size:6.5px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.se{display:flex;gap:6px;align-items:flex-start;margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid #f0f0f0}
.sd{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:3px}
.st{font-size:9px;font-weight:700}
.sm{font-size:8px;color:#888;line-height:1.3}
.ft{margin-top:8px;text-align:center;font-size:8px;color:#bbb}
@media screen{
  body{padding:20px;max-width:1100px;margin:0 auto}
  .np{display:flex;justify-content:center;gap:10px;margin-bottom:16px}
  .np button{padding:10px 28px;font-size:14px;font-weight:700;border:none;border-radius:10px;cursor:pointer;transition:transform .1s}
  .np button:hover{transform:translateY(-1px)}
  .pb{background:${primaryColor};color:#fff}
  .cb{background:#e5e7eb;color:#333}
}
@media print{.np{display:none!important}}
</style>
</head>
<body>
<div class="np">
  <button class="pb" onclick="window.print()">Print Calendar</button>
  <button class="cb" onclick="window.close()">Close</button>
</div>
<div class="hdr">
  <div><h1>Community Calendar</h1></div>
  <div class="mo">${esc(monthLabel)}</div>
</div>
<div class="lay">
  <div class="cal">
    <table>
      <thead><tr>${DAY_HEADERS.map((d) => `<th>${d}</th>`).join("")}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
  <div class="sb">
    <h3>Events This Month</h3>
    ${sidebarHtml || '<div class="sm">No events this month</div>'}
  </div>
</div>
<div class="ft">casperevents.org &middot; Printed ${format(new Date(), "MMM d, yyyy")}</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

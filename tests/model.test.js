const assert = require("node:assert/strict")
const model = require("../Model.js")

assert.ok(model.VERSES.length >= 120, "curated Scripture list should be substantial")
assert.ok(model.VERSES.length <= 250, "curated list should stay hand-reviewed")
assert.equal(model.HOURS.length, 6)
assert.deepEqual(model.HOURS.map((h) => h.id), ["morning", "prime", "terce", "sext", "none", "evening"])
assert.equal(model.hourById("terce").traditional, "Third Hour")
assert.equal(model.hourById("none").latin, "Nona")

assert.equal(model.isoDate(new Date(2026, 0, 5)), "2026-01-05")
assert.equal(model.parseHm("9:00", "06:00"), "09:00")
assert.equal(model.parseHm("24:00", "06:00"), "06:00")
assert.equal(model.parseHm("nope", "07:00"), "07:00")
assert.equal(model.minutesFromHm("06:00"), 360)
assert.equal(model.minutesFromHm("15:00"), 900)
assert.equal(model.minutesOfDay(new Date(2026, 7, 19, 9, 30)), 570)

assert.equal(model.formatUntil(540, 540, false), "now")
assert.equal(model.formatUntil(540, 555, false), "in 15 min")
assert.equal(model.formatUntil(540, 600, false), "in 1 hour")
assert.match(model.formatUntil(18 * 60, 6 * 60, true), /in /)

assert.equal(model.nextPosition(-1, 3, "sequential", "x"), 0)
assert.equal(model.nextPosition(2, 3, "sequential", "x"), 0)
assert.equal(model.nextPosition(-1, 9, "random", "2026-01-01v"), model.nextPosition(4, 9, "random", "2026-01-01v"))

assert.equal(model.choice("KJV", ["web", "kjv", "asv"], "web"), "kjv")
assert.equal(model.choice("nlt", ["web", "kjv"], "web"), "web")
assert.equal(model.boolSetting(undefined, true), true)
assert.equal(model.boolSetting(false, true), false)
assert.equal(model.translationName("clementine"), "Clementine Vulgate (Latin)")

assert.equal(
  model.bibleUrl("John 3:16", "web"),
  "https://bible-api.com/John+3:16?translation=web"
)
assert.equal(
  model.bibleUrl("Psalm 23:1-3", "KJV"),
  "https://bible-api.com/Psalm+23:1-3?translation=kjv"
)

const parsed = model.parseBible(JSON.stringify({
  reference: "John 3:16",
  text: "  For God so loved the world.\n",
  translation_id: "web",
  translation_name: "World English Bible"
}), "John 3:16", "web")
assert.equal(parsed.reference, "John 3:16")
assert.equal(parsed.text, "For God so loved the world.")
assert.equal(parsed.translation, "World English Bible")
assert.equal(model.parseBible("not-json", "John 3:16", "web"), null)

const hours = model.resolvedHours({ primeEnabled: false, terceTime: "9:15" })
assert.equal(hours.find((h) => h.id === "prime").enabled, false)
assert.equal(hours.find((h) => h.id === "terce").time, "09:15")
assert.equal(model.enabledHours({ primeEnabled: false }).length, 5)

const midMorning = new Date(2026, 7, 19, 10, 0)
const schedule = model.scheduleState(midMorning, {})
assert.equal(schedule.current.id, "terce")
assert.equal(schedule.next.id, "sext")
assert.equal(model.isCurrentWindow(schedule.current, schedule.nowMinutes, schedule.next, 20), false)

const terceNow = new Date(2026, 7, 19, 9, 5)
const terceSchedule = model.scheduleState(terceNow, {})
assert.ok(model.isCurrentWindow(terceSchedule.current, terceSchedule.nowMinutes, terceSchedule.next, 20))

const due = model.dueNotifications(new Date(2026, 7, 19, 9, 2), {}, {}, 5)
assert.equal(due.length, 1)
assert.equal(due[0].id, "terce")
assert.equal(model.dueNotifications(new Date(2026, 7, 19, 9, 2), {}, { terce: "2026-08-19" }, 5).length, 0)
assert.equal(model.dueNotifications(new Date(2026, 7, 19, 10, 0), {}, {}, 5).length, 0)

assert.equal(model.notificationTitle(model.hourById("none")), "None — Ninth Hour")
assert.ok(model.notificationBody(model.hourById("morning"), "John 3:16").includes("Today’s Scripture: John 3:16"))

assert.equal(model.verseForPosition(0), model.VERSES[0])
assert.equal(model.verseForPosition(model.VERSES.length), model.VERSES[0])

const afterEvening = model.scheduleState(new Date(2026, 7, 19, 22, 0), {})
assert.equal(afterEvening.next.id, "morning")
assert.equal(afterEvening.next.tomorrow, true)

console.log("Liturgy of the Hours model tests passed")

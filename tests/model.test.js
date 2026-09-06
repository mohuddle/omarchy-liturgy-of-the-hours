const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const model = require("../Model.js")

assert.ok(model.VERSES.length >= 120, "curated Scripture list should be substantial")
assert.ok(model.VERSES.length <= 250, "curated list should stay hand-reviewed")
assert.equal(model.HOURS.length, 6)
assert.deepEqual(model.HOURS.map((h) => h.id), ["morning", "prime", "terce", "sext", "none", "evening"])
assert.equal(model.hourById("terce").traditional, "Third Hour")
assert.equal(model.hourById("none").latin, "Nona")
assert.equal(model.hourById("evening").shortName, "Vespers")

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

assert.equal(model.boolSetting(undefined, true), true)
assert.equal(model.boolSetting(false, true), false)

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/verses.json"), "utf8"))
assert.equal(catalog.translation, "BSB")
assert.equal(catalog.verses.length, model.VERSES.length)
assert.deepEqual(catalog.verses.map((item) => item.reference), model.VERSES)
const john = model.verseFromCatalog(catalog, model.VERSES.indexOf("John 14:27"))
assert.equal(john.reference, "John 14:27")
assert.match(john.text, /Peace I leave with you/)
assert.equal(john.translationId, "bsb")
assert.equal(model.verseFromCatalog({ verses: [] }, 0), null)

const hours = model.resolvedHours({ primeEnabled: false, terceTime: "9:15" })
assert.equal(hours.find((h) => h.id === "prime").enabled, false)
assert.equal(hours.find((h) => h.id === "terce").time, "09:15")
assert.equal(model.enabledHours({ primeEnabled: false }).length, 5)

const midMorning = new Date(2026, 7, 19, 10, 0)
const schedule = model.scheduleState(midMorning, {})
assert.equal(schedule.current.id, "terce")
assert.equal(schedule.next.id, "sext")
assert.equal(model.featuredHour(schedule).id, "terce")
assert.equal(model.heroMeta(schedule.current), "Terce · Third Hour · 09:00")
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
assert.equal(model.plainText("a <img src=x> & b", 80), "a img src=x  b")
assert.deepEqual(model.parseCache(""), model.parseCache("   "))
assert.equal(model.parseCache("{not json"), null)
const cached = model.parseCache(JSON.stringify({
  date: "2026-08-19",
  translation: "bsb",
  verse_position: 2,
  reference: "John 3:16",
  text: "For God so loved the world",
  last_notified: { terce: "2026-08-19", evil: "nope" }
}))
assert.equal(cached.reference, "John 3:16")
assert.deepEqual(cached.last_notified, { terce: "2026-08-19" })

const hourTitles = model.hourNotificationTitles()
assert.equal(hourTitles.length, 6)
assert.equal(new Set(hourTitles).size, 6)
assert.ok(hourTitles.includes("Terce — Third Hour"))
assert.ok(fs.existsSync(path.join(__dirname, "../data/church-bell.ogg")), "bundled church bell")

assert.equal(model.verseForPosition(0), model.VERSES[0])
assert.equal(model.verseForPosition(model.VERSES.length), model.VERSES[0])

const afterEvening = model.scheduleState(new Date(2026, 7, 19, 22, 0), {})
assert.equal(afterEvening.next.id, "morning")
assert.equal(afterEvening.next.tomorrow, true)
assert.equal(model.featuredHour(afterEvening).id, "evening")

assert.equal(model.easterDate(2026).getFullYear(), 2026)
assert.equal(model.easterDate(2026).getMonth(), 3)
assert.equal(model.easterDate(2026).getDate(), 5)

const fridayTrinity = model.liturgicalDay(new Date(2026, 7, 21))
assert.equal(fridayTrinity.spoken, "Friday in the week following the Eleventh Sunday after Trinity")
assert.equal(fridayTrinity.seasonKey, "trinity")
assert.equal(fridayTrinity.weekNumber, 11)
assert.equal(fridayTrinity.weekday, "Friday")
assert.equal(model.liturgicalDay(new Date(2026, 4, 31)).spoken, "Trinity Sunday")
assert.equal(model.liturgicalDay(new Date(2026, 3, 5)).spoken, "Easter Day")
assert.equal(model.liturgicalDay(new Date(2026, 10, 29)).spoken, "the First Sunday in Advent")
assert.equal(model.liturgicalDay(new Date(2026, 7, 16)).spoken, "the Eleventh Sunday after Trinity")

const officeBook = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/office.json"), "utf8"))
assert.ok(officeBook.chapters.trinity.none.reference)
assert.ok(officeBook.collects.some((item) => item.id === "trinity-11"))
const noneHour = model.hourById("none")
const built = model.buildOffice(new Date(2026, 7, 21, 15, 5), noneHour, officeBook, "2026-08-21")
assert.equal(built.heading, "Friday in the week following the Eleventh Sunday after Trinity")
assert.equal(built.hourShortName, "None")
assert.equal(built.chapter.reference, "1 Corinthians 6:20")
assert.match(built.chapter.text, /bought at a price/)
assert.match(built.respond.respond, /Buy us back/)
assert.equal(built.memorial.id, "cross")
assert.match(built.collect.text, /Amen/)
assert.equal(built.sections.length, 4)
assert.equal(model.officeNotificationTitle(), "The Office")
assert.match(model.officeNotificationBody(built), /THE CHAPTER/)
assert.ok(model.pluginNotificationTitles().includes("The Office"))

console.log("Liturgy of the Hours model tests passed")

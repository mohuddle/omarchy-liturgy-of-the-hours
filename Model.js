// Pure reference math for the Liturgy of the Hours widget. Locale- and
// Qt-free so it can be unit tested under node (tests/model.test.js).

var HOURS = [
  {
    id: "morning",
    latin: "Laudes",
    name: "Morning Prayer",
    shortName: "Lauds",
    traditional: "Dawn",
    defaultTime: "06:00",
    invitatory: "O Lord, open my lips. And my mouth shall proclaim your praise.",
    hymn: "The night has passed and the day lies open before us; let us pray with one heart and mind.",
    prayer: "Father, we praise you with this morning offering. Make us faithful to your word, and bring us to the glory of the resurrection. Through Christ our Lord. Amen.",
    psalm: "Psalm 5:3",
    psalmText: "O Lord, in the morning you hear my voice; in the morning I plead my case to you, and watch."
  },
  {
    id: "prime",
    latin: "Prima",
    name: "Prime",
    shortName: "Prime",
    traditional: "First Hour",
    defaultTime: "07:00",
    invitatory: "O God, come to my assistance. O Lord, make haste to help me.",
    hymn: "Now that the daylight fills the sky, we lift our hearts to God on high, that he, in all we do or say, would keep us free from harm today.",
    prayer: "Lord God, king of heaven and earth, guide and sanctify, rule and govern our hearts and bodies this day in the ways of your commandments. Through Christ our Lord. Amen.",
    psalm: "Psalm 119:147-148",
    psalmText: "I rise before dawn and cry for help; I put my hope in your words. My eyes are awake before each watch of the night, that I may meditate on your promise."
  },
  {
    id: "terce",
    latin: "Tertia",
    name: "Terce",
    shortName: "Terce",
    traditional: "Third Hour",
    defaultTime: "09:00",
    invitatory: "O God, come to my assistance. O Lord, make haste to help me.",
    hymn: "Come, Holy Spirit, fill the hearts of your faithful, and kindle in them the fire of your love.",
    prayer: "Lord God, you sent the Holy Spirit upon the apostles at the third hour. Grant us a share in that gift, that we may bear witness to your name. Through Christ our Lord. Amen.",
    psalm: "Acts 2:15-17",
    psalmText: "These people are not drunk, as you suppose, for it is only nine o’clock in the morning. No, this is what was spoken through the prophet Joel: In the last days it will be, God declares, that I will pour out my Spirit upon all flesh."
  },
  {
    id: "sext",
    latin: "Sexta",
    name: "Sext",
    shortName: "Sext",
    traditional: "Sixth Hour",
    defaultTime: "12:00",
    invitatory: "O God, come to my assistance. O Lord, make haste to help me.",
    hymn: "At noon you hung upon the Cross, O Christ; grant that we may take up our cross and follow you.",
    prayer: "Almighty Father, you gave your Son to die for us at the sixth hour. Keep us steadfast in his Passion, that we may share in the glory of his resurrection. Through Christ our Lord. Amen.",
    psalm: "John 19:14-16",
    psalmText: "Now it was the day of Preparation for the Passover; and it was about noon. He said to the Jews, Here is your King! They cried out, Away with him! Crucify him!"
  },
  {
    id: "none",
    latin: "Nona",
    name: "None",
    shortName: "None",
    traditional: "Ninth Hour",
    defaultTime: "15:00",
    invitatory: "O God, come to my assistance. O Lord, make haste to help me.",
    hymn: "At the ninth hour you commended your spirit to the Father; teach us to live and die in your peace.",
    prayer: "Lord Jesus Christ, at the ninth hour you yielded up your spirit. By your death, take away the death of our sin, and grant us the life that never ends. Amen.",
    psalm: "Luke 23:44-46",
    psalmText: "It was now about noon, and darkness came over the whole land until three in the afternoon. Then Jesus, crying with a loud voice, said, Father, into your hands I commend my spirit."
  },
  {
    id: "evening",
    latin: "Vesperae",
    name: "Evening Prayer",
    shortName: "Vespers",
    traditional: "Sunset",
    defaultTime: "18:00",
    invitatory: "O God, come to my assistance. O Lord, make haste to help me.",
    hymn: "Let my prayer be counted as incense before you, and the lifting up of my hands as an evening sacrifice.",
    prayer: "Stay with us, Lord, for it is evening and the day is almost over. Kindle in our hearts the hope of the resurrection, and keep us in your peace this night. Through Christ our Lord. Amen.",
    psalm: "Luke 1:46-47",
    psalmText: "My soul magnifies the Lord, and my spirit rejoices in God my Savior."
  }
]

var TRANSLATIONS = [
  { code: "web", name: "World English Bible" },
  { code: "kjv", name: "King James Version" },
  { code: "asv", name: "American Standard Version" },
  { code: "bbe", name: "Bible in Basic English" },
  { code: "webbe", name: "World English Bible (British)" },
  { code: "oeb-us", name: "Open English Bible (US)" },
  { code: "clementine", name: "Clementine Vulgate (Latin)" }
]

// Curated daily Scripture. bible-api.com has no dedicated verse-of-the-day
// endpoint, so the plugin picks a reference itself and fetches the text.
var VERSES = [
  "Genesis 1:1",
  "Genesis 1:27",
  "Genesis 50:20",
  "Exodus 14:14",
  "Exodus 33:14",
  "Deuteronomy 6:4-5",
  "Deuteronomy 31:6",
  "Joshua 1:9",
  "Joshua 24:15",
  "Ruth 1:16",
  "1 Samuel 16:7",
  "1 Chronicles 16:34",
  "2 Chronicles 7:14",
  "Nehemiah 8:10",
  "Job 19:25",
  "Psalm 1:1-2",
  "Psalm 4:8",
  "Psalm 5:3",
  "Psalm 16:11",
  "Psalm 18:2",
  "Psalm 19:14",
  "Psalm 23:1-3",
  "Psalm 23:4",
  "Psalm 27:1",
  "Psalm 27:4",
  "Psalm 34:8",
  "Psalm 37:5",
  "Psalm 42:1",
  "Psalm 46:1",
  "Psalm 46:10",
  "Psalm 51:10",
  "Psalm 63:1",
  "Psalm 90:12",
  "Psalm 91:1-2",
  "Psalm 95:1-3",
  "Psalm 100:1-3",
  "Psalm 103:1-2",
  "Psalm 118:24",
  "Psalm 119:105",
  "Psalm 121:1-2",
  "Psalm 122:1",
  "Psalm 127:1",
  "Psalm 130:1-2",
  "Psalm 139:23-24",
  "Psalm 145:18",
  "Psalm 150:6",
  "Proverbs 3:5-6",
  "Proverbs 9:10",
  "Proverbs 16:9",
  "Ecclesiastes 3:1",
  "Isaiah 9:6",
  "Isaiah 26:3",
  "Isaiah 40:31",
  "Isaiah 41:10",
  "Isaiah 43:1-2",
  "Isaiah 53:5",
  "Isaiah 55:6-7",
  "Jeremiah 29:11",
  "Lamentations 3:22-23",
  "Ezekiel 36:26",
  "Micah 6:8",
  "Habakkuk 3:17-18",
  "Zephaniah 3:17",
  "Matthew 5:3-4",
  "Matthew 5:9",
  "Matthew 5:14-16",
  "Matthew 5:44",
  "Matthew 6:9-13",
  "Matthew 6:33",
  "Matthew 7:7",
  "Matthew 11:28-30",
  "Matthew 16:24",
  "Matthew 22:37-39",
  "Matthew 28:19-20",
  "Mark 8:34",
  "Mark 10:45",
  "Mark 12:30-31",
  "Luke 1:38",
  "Luke 1:46-49",
  "Luke 6:31",
  "Luke 6:36",
  "Luke 9:23",
  "Luke 11:9",
  "Luke 12:32",
  "Luke 22:42",
  "John 1:1",
  "John 1:14",
  "John 3:16",
  "John 6:35",
  "John 8:12",
  "John 8:32",
  "John 10:11",
  "John 11:25-26",
  "John 13:34-35",
  "John 14:6",
  "John 14:27",
  "John 15:5",
  "John 15:12",
  "John 16:33",
  "Acts 1:8",
  "Acts 2:42",
  "Romans 5:8",
  "Romans 8:28",
  "Romans 8:38-39",
  "Romans 12:1-2",
  "Romans 12:12",
  "Romans 15:13",
  "1 Corinthians 10:13",
  "1 Corinthians 13:4-7",
  "1 Corinthians 13:13",
  "1 Corinthians 15:57",
  "2 Corinthians 4:16-18",
  "2 Corinthians 5:17",
  "2 Corinthians 12:9",
  "Galatians 2:20",
  "Galatians 5:22-23",
  "Galatians 6:9",
  "Ephesians 2:8-9",
  "Ephesians 3:20",
  "Ephesians 4:32",
  "Ephesians 6:10-11",
  "Philippians 1:6",
  "Philippians 2:3-4",
  "Philippians 4:4-7",
  "Philippians 4:8",
  "Philippians 4:13",
  "Colossians 3:12-14",
  "Colossians 3:16",
  "Colossians 3:23",
  "1 Thessalonians 5:16-18",
  "2 Timothy 1:7",
  "2 Timothy 4:7",
  "Hebrews 4:16",
  "Hebrews 11:1",
  "Hebrews 12:1-2",
  "Hebrews 13:8",
  "James 1:5",
  "James 1:17",
  "James 1:22",
  "James 4:7-8",
  "1 Peter 5:6-7",
  "1 John 1:9",
  "1 John 4:7-8",
  "1 John 4:16",
  "1 John 4:19",
  "Revelation 3:20",
  "Revelation 21:4"
]

function pad2(n) {
  return n < 10 ? "0" + n : String(n)
}

function isoDate(date) {
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate())
}

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function parseHm(value, fallback) {
  var m = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return fallback || "06:00"
  var h = parseInt(m[1], 10)
  var min = parseInt(m[2], 10)
  if (h > 23 || min > 59) return fallback || "06:00"
  return pad2(h) + ":" + pad2(min)
}

function minutesFromHm(value) {
  var parsed = parseHm(value, "00:00")
  var parts = parsed.split(":")
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

function formatClock(hm) {
  return parseHm(hm, hm)
}

function formatUntil(fromMin, toMin, tomorrow) {
  var delta = toMin - fromMin
  if (tomorrow) delta += 24 * 60
  if (delta < 0) delta += 24 * 60
  if (delta === 0) return "now"
  if (delta === 1) return "in 1 min"
  if (delta < 60) return "in " + delta + " min"
  var h = Math.floor(delta / 60)
  var m = delta % 60
  if (m === 0) return h === 1 ? "in 1 hour" : "in " + h + " hours"
  return "in " + h + "h " + m + "m"
}

function choice(value, allowed, fallback) {
  var v = String(value || "").toLowerCase()
  return allowed.indexOf(v) >= 0 ? v : fallback
}

function boolSetting(value, fallback) {
  if (value === undefined || value === null) return fallback
  if (value === true || value === "true") return true
  if (value === false || value === "false") return false
  return fallback
}

function nextPosition(position, length, style, salt) {
  if (length <= 0) return -1
  if (String(style) !== "random") return (Number(position) + 1 + length) % length
  var hash = 0
  var text = String(salt || "")
  for (var i = 0; i < text.length; i++) hash = ((hash * 31) + text.charCodeAt(i)) >>> 0
  return hash % length
}

function cleanVerseText(raw) {
  return String(raw || "").replace(/\s+/g, " ").trim()
}

function translationCodes() {
  return TRANSLATIONS.map(function(item) { return item.code })
}

function translationName(code) {
  var wanted = String(code || "").toLowerCase()
  for (var i = 0; i < TRANSLATIONS.length; i++) {
    if (TRANSLATIONS[i].code === wanted) return TRANSLATIONS[i].name
  }
  return wanted || "World English Bible"
}

function bibleUrl(reference, translation) {
  var ref = String(reference || "").trim().replace(/ /g, "+")
  var t = choice(translation, translationCodes(), "web")
  return "https://bible-api.com/" + ref + "?translation=" + encodeURIComponent(t)
}

function parseBible(raw, reference, translation) {
  try {
    var value = JSON.parse(String(raw || ""))
    if (!value || (value.text === undefined && !Array.isArray(value.verses))) return null
    if (value.error) return null
    return {
      reference: String(value.reference || reference || ""),
      text: cleanVerseText(value.text),
      translation: String(value.translation_name || translationName(translation)),
      translationId: String(value.translation_id || translation || "web")
    }
  } catch (e) { return null }
}

function hourById(id) {
  for (var i = 0; i < HOURS.length; i++) if (HOURS[i].id === id) return HOURS[i]
  return null
}

function copyHour(hour, extra) {
  var out = {
    id: hour.id,
    latin: hour.latin,
    name: hour.name,
    shortName: hour.shortName,
    traditional: hour.traditional,
    invitatory: hour.invitatory,
    hymn: hour.hymn,
    prayer: hour.prayer,
    psalm: hour.psalm,
    psalmText: hour.psalmText,
    enabled: hour.enabled,
    time: hour.time,
    minutes: hour.minutes,
    tomorrow: !!hour.tomorrow
  }
  if (extra) for (var key in extra) out[key] = extra[key]
  return out
}

function resolvedHours(settings) {
  settings = settings || {}
  return HOURS.map(function(hour) {
    var enabled = boolSetting(settings[hour.id + "Enabled"], true)
    var time = parseHm(settings[hour.id + "Time"], hour.defaultTime)
    return copyHour(hour, {
      enabled: enabled,
      time: time,
      minutes: minutesFromHm(time),
      tomorrow: false
    })
  })
}

function enabledHours(settings) {
  return resolvedHours(settings).filter(function(hour) { return hour.enabled })
}

function scheduleState(now, settings) {
  var hours = enabledHours(settings).slice().sort(function(a, b) { return a.minutes - b.minutes })
  var nowMin = minutesOfDay(now)
  var current = null
  var next = null
  for (var i = 0; i < hours.length; i++) {
    if (hours[i].minutes <= nowMin) current = hours[i]
    else if (!next) next = hours[i]
  }
  if (!next && hours.length > 0) next = copyHour(hours[0], { tomorrow: true })
  return {
    hours: hours,
    all: resolvedHours(settings),
    current: current,
    next: next,
    nowMinutes: nowMin
  }
}

function isCurrentWindow(hour, nowMin, nextHour, windowMinutes) {
  if (!hour || hour.tomorrow) return false
  var window = windowMinutes === undefined ? 20 : windowMinutes
  if (nowMin < hour.minutes) return false
  var end = hour.minutes + window
  if (nextHour && !nextHour.tomorrow && nextHour.minutes > hour.minutes)
    end = Math.min(end, nextHour.minutes)
  return nowMin < end
}

function dueNotifications(now, settings, lastNotified, graceMinutes) {
  var today = isoDate(now)
  var nowMin = minutesOfDay(now)
  var grace = graceMinutes === undefined ? 5 : graceMinutes
  var due = []
  var hours = enabledHours(settings)
  for (var i = 0; i < hours.length; i++) {
    var hour = hours[i]
    if ((lastNotified || {})[hour.id] === today) continue
    var delta = nowMin - hour.minutes
    if (delta >= 0 && delta <= grace) due.push(hour)
  }
  return due
}

function notificationTitle(hour) {
  if (!hour) return "Liturgy of the Hours"
  return hour.name + " — " + hour.traditional
}

function notificationBody(hour, verseReference) {
  var lines = []
  if (hour) {
    if (hour.hymn) lines.push(hour.hymn)
    if (hour.invitatory) lines.push(hour.invitatory)
  }
  if (verseReference) lines.push("Today’s Scripture: " + verseReference)
  return lines.join("\n")
}

function verseForPosition(position) {
  if (VERSES.length === 0) return ""
  var idx = Math.max(0, Number(position) || 0) % VERSES.length
  return VERSES[idx]
}

if (typeof module !== "undefined") {
  module.exports = {
    HOURS: HOURS,
    TRANSLATIONS: TRANSLATIONS,
    VERSES: VERSES,
    pad2: pad2,
    isoDate: isoDate,
    minutesOfDay: minutesOfDay,
    parseHm: parseHm,
    minutesFromHm: minutesFromHm,
    formatClock: formatClock,
    formatUntil: formatUntil,
    choice: choice,
    boolSetting: boolSetting,
    nextPosition: nextPosition,
    cleanVerseText: cleanVerseText,
    translationCodes: translationCodes,
    translationName: translationName,
    bibleUrl: bibleUrl,
    parseBible: parseBible,
    hourById: hourById,
    resolvedHours: resolvedHours,
    enabledHours: enabledHours,
    scheduleState: scheduleState,
    isCurrentWindow: isCurrentWindow,
    dueNotifications: dueNotifications,
    notificationTitle: notificationTitle,
    notificationBody: notificationBody,
    verseForPosition: verseForPosition
  }
}

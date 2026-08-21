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

// Curated daily Scripture. Texts are the Berean Standard Bible (CC0),
// bundled in data/verses.json so the panel never needs a translation picker.
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

function fileUrlToPath(url) {
  var s = String(url || "")
  if (s.indexOf("file://") === 0) {
    s = s.substring(7)
    if (s.charAt(0) !== "/") s = "/" + s
    try { s = decodeURIComponent(s) } catch (e) {}
  }
  return s
}

function catalogVerses(catalog) {
  if (Array.isArray(catalog)) return catalog
  if (catalog && Array.isArray(catalog.verses)) return catalog.verses
  return []
}

function verseFromCatalog(catalog, position) {
  var verses = catalogVerses(catalog)
  if (verses.length === 0) return null
  var idx = Math.max(0, Number(position) || 0) % verses.length
  var item = verses[idx] || {}
  var text = cleanVerseText(item.text)
  if (text === "") return null
  return {
    reference: String(item.reference || verseForPosition(idx)),
    text: text,
    translation: "Berean Standard Bible",
    translationId: "bsb"
  }
}

function featuredHour(schedule) {
  if (!schedule) return null
  return schedule.current || schedule.next || null
}

function heroMeta(hour) {
  if (!hour) return ""
  return hour.shortName + " · " + hour.traditional + " · " + hour.time
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

function hourNotificationTitles() {
  return HOURS.map(function(hour) { return notificationTitle(hour) })
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

var ORDINALS = [
  "", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh",
  "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth",
  "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth",
  "Nineteenth", "Twentieth", "Twenty-first", "Twenty-second",
  "Twenty-third", "Twenty-fourth", "Twenty-fifth", "Twenty-sixth",
  "Twenty-seventh"
]

var WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

var RED_LETTER = {
  "1-1": "the Circumcision of Christ",
  "1-6": "the Epiphany of our Lord",
  "1-25": "the Conversion of Saint Paul",
  "2-2": "the Presentation of Christ in the Temple",
  "2-24": "Saint Matthias the Apostle",
  "3-25": "the Annunciation of the Blessed Virgin Mary",
  "4-25": "Saint Mark the Evangelist",
  "6-11": "Saint Barnabas the Apostle",
  "6-24": "the Nativity of Saint John the Baptist",
  "6-29": "Saint Peter the Apostle",
  "7-25": "Saint James the Apostle",
  "8-6": "the Transfiguration of our Lord",
  "8-15": "the feast of Saint Mary the Virgin",
  "8-24": "Saint Bartholomew the Apostle",
  "9-21": "Saint Matthew the Apostle",
  "9-29": "Saint Michael and All Angels",
  "10-18": "Saint Luke the Evangelist",
  "10-28": "Saint Simon and Saint Jude, Apostles",
  "11-1": "All Saints",
  "11-30": "Saint Andrew the Apostle",
  "12-21": "Saint Thomas the Apostle",
  "12-25": "the Nativity of our Lord",
  "12-26": "Saint Stephen, Deacon and Martyr",
  "12-27": "Saint John the Apostle and Evangelist",
  "12-28": "the Holy Innocents"
}

var YEAR_NOTES = {
  2026: { easter: "2026-04-05", ash: "2026-02-18", palm: "2026-03-29", ascension: "2026-05-14", pentecost: "2026-05-24", trinity: "2026-05-31", advent: "2026-11-29" }
}

function dateAt(year, month, day) {
  return new Date(year, month - 1, day)
}

function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000)
}

function sundayOnOrBefore(d) {
  return addDays(d, -d.getDay())
}

function nthSundayAfter(anchor, d) {
  return Math.floor(daysBetween(anchor, sundayOnOrBefore(d)) / 7)
}

function parseISODate(iso) {
  var parts = String(iso || "").split("-")
  return dateAt(Number(parts[0]), Number(parts[1]), Number(parts[2]))
}

function easterDate(year) {
  var a = year % 19
  var b = Math.floor(year / 100)
  var c = year % 100
  var d = Math.floor(b / 4)
  var e = b % 4
  var f = Math.floor((b + 8) / 25)
  var g = Math.floor((b - f + 1) / 3)
  var h = (19 * a + b - d - g + 15) % 30
  var i = Math.floor(c / 4)
  var k = c % 4
  var l = (32 + 2 * e + 2 * i - h - k) % 7
  var m = Math.floor((a + 11 * h + 22 * l) / 451)
  var monthDay = h + l - 7 * m + 114
  var month = Math.floor(monthDay / 31)
  var day = (monthDay % 31) + 1
  return dateAt(year, month, day)
}

function adventSunday(year) {
  var d = dateAt(year, 11, 27)
  for (var i = 0; i < 7; i++) {
    var candidate = addDays(d, i)
    if (candidate.getDay() === 0) return candidate
  }
  return d
}

function yearAnchors(year) {
  var notes = YEAR_NOTES[year]
  if (notes) {
    return {
      easter: parseISODate(notes.easter),
      ash: parseISODate(notes.ash),
      palm: parseISODate(notes.palm),
      ascension: parseISODate(notes.ascension),
      pentecost: parseISODate(notes.pentecost),
      trinity: parseISODate(notes.trinity),
      advent: parseISODate(notes.advent)
    }
  }
  var e = easterDate(year)
  return {
    easter: e,
    ash: addDays(e, -46),
    palm: addDays(e, -7),
    ascension: addDays(e, 39),
    pentecost: addDays(e, 49),
    trinity: addDays(e, 56),
    advent: adventSunday(year)
  }
}

function weekdayName(d) {
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

function liturgicalDay(d) {
  d = startOfDay(d)
  var year = d.getFullYear()
  var notes = yearAnchors(year)
  var easter = notes.easter
  var ash = notes.ash
  var palm = notes.palm
  var ascension = notes.ascension
  var pentecost = notes.pentecost
  var trinity = notes.trinity
  var advent = notes.advent
  var christmas = dateAt(year, 12, 25)
  var epiphany = dateAt(year, 1, 6)
  var feast = RED_LETTER[(d.getMonth() + 1) + "-" + d.getDate()] || null
  var weekday = weekdayName(d)
  var season = "the Christian year"
  var seasonKey = "trinity"
  var weekNumber = null
  function cmp(a, b) { return daysBetween(b, a) }

  if (cmp(d, christmas) === 0) {
    season = "Christmas Day"
    seasonKey = "christmas"
  } else if (cmp(d, dateAt(year, 12, 24)) === 0) {
    season = "Christmas Eve"
    seasonKey = "christmas"
  } else if (cmp(d, dateAt(year, 12, 26)) >= 0 || cmp(d, dateAt(year, 1, 5)) <= 0) {
    season = "Christmastide"
    seasonKey = "christmas"
  } else if (cmp(d, epiphany) === 0) {
    season = "the Epiphany of our Lord"
    seasonKey = "epiphany"
    weekNumber = 0
  } else if (cmp(d, epiphany) > 0 && cmp(d, ash) < 0) {
    var firstEpiphany = addDays(epiphany, (7 - epiphany.getDay()) % 7)
    if (cmp(firstEpiphany, epiphany) <= 0) firstEpiphany = addDays(firstEpiphany, 7)
    var nEp = nthSundayAfter(addDays(firstEpiphany, -7), d)
    seasonKey = "epiphany"
    weekNumber = Math.max(nEp, 1)
    season = d.getDay() === 0
      ? "the " + ORDINALS[nEp] + " Sunday after Epiphany"
      : "the week following the " + ORDINALS[Math.max(nEp, 1)] + " Sunday after Epiphany"
  } else if (cmp(d, ash) === 0) {
    season = "Ash Wednesday"
    seasonKey = "lent"
    weekNumber = 0
  } else if (cmp(d, ash) > 0 && cmp(d, palm) < 0) {
    var firstLent = addDays(ash, (7 - ash.getDay()) % 7)
    if (cmp(firstLent, ash) === 0) firstLent = addDays(firstLent, 7)
    seasonKey = "lent"
    if (cmp(d, firstLent) < 0) {
      season = "the week of Ash Wednesday"
      weekNumber = 0
    } else if (d.getDay() === 0) {
      weekNumber = Math.floor(daysBetween(firstLent, d) / 7) + 1
      season = "the " + ORDINALS[weekNumber] + " Sunday in Lent"
    } else {
      weekNumber = Math.max(nthSundayAfter(firstLent, d), 1)
      season = "the week following the " + ORDINALS[weekNumber] + " Sunday in Lent"
    }
  } else if (cmp(d, palm) === 0) {
    season = "Palm Sunday"
    seasonKey = "holyweek"
  } else if (cmp(d, palm) > 0 && cmp(d, easter) < 0) {
    season = "Holy Week"
    seasonKey = "holyweek"
  } else if (cmp(d, easter) === 0) {
    season = "Easter Day"
    seasonKey = "easter"
    weekNumber = 0
  } else if (cmp(d, easter) > 0 && cmp(d, ascension) < 0) {
    var nEaster = nthSundayAfter(easter, d)
    seasonKey = "easter"
    weekNumber = nEaster
    if (d.getDay() === 0) season = "the " + ORDINALS[nEaster] + " Sunday after Easter"
    else if (nEaster) season = "the week following the " + ORDINALS[Math.max(nEaster, 1)] + " Sunday after Easter"
    else season = "Easter Week"
  } else if (cmp(d, ascension) === 0) {
    season = "Ascension Day"
    seasonKey = "ascension"
  } else if (cmp(d, ascension) > 0 && cmp(d, pentecost) < 0) {
    season = "the week following Ascension Day"
    seasonKey = "ascension"
  } else if (cmp(d, pentecost) === 0) {
    season = "Whitsunday, the Feast of Pentecost"
    seasonKey = "pentecost"
  } else if (cmp(d, pentecost) > 0 && cmp(d, trinity) < 0) {
    season = "the week following Whitsunday"
    seasonKey = "pentecost"
  } else if (cmp(d, trinity) === 0) {
    season = "Trinity Sunday"
    seasonKey = "trinity"
    weekNumber = 0
  } else if (cmp(d, trinity) > 0 && cmp(d, advent) < 0) {
    var nTrin = nthSundayAfter(trinity, d)
    seasonKey = "trinity"
    weekNumber = nTrin
    season = d.getDay() === 0
      ? "the " + ORDINALS[nTrin] + " Sunday after Trinity"
      : "the week following the " + ORDINALS[Math.max(nTrin, 1)] + " Sunday after Trinity"
  } else if (cmp(d, advent) >= 0 && cmp(d, christmas) < 0) {
    var nAdv = Math.floor(daysBetween(advent, d) / 7) + 1
    seasonKey = "advent"
    weekNumber = nAdv
    season = d.getDay() === 0
      ? "the " + ORDINALS[nAdv] + " Sunday in Advent"
      : "the week following the " + ORDINALS[nAdv] + " Sunday in Advent"
  }

  var spoken
  if (season === "Holy Week" || season === "Easter Week" || season === "Christmastide" || season.indexOf("the week") === 0) {
    spoken = weekday + " in " + season
  } else if (season.indexOf("Day") >= 0 || season.indexOf("Ash") === 0 || season.indexOf("Whitsunday") === 0 || season.indexOf("Eve") >= 0) {
    spoken = (d.getDay() === 0 || season.indexOf("Day") >= 0) ? season : weekday + ", " + season
  } else if (d.getDay() === 0) {
    spoken = season
  } else {
    spoken = weekday + " in " + season
  }

  return {
    date: isoDate(d),
    weekday: weekday,
    season: season,
    seasonKey: seasonKey,
    weekNumber: weekNumber,
    feast: feast,
    spoken: spoken
  }
}

function officeNotificationTitle() {
  return "The Office"
}

function pluginNotificationTitles() {
  return hourNotificationTitles().concat([officeNotificationTitle()])
}

function lookupHourEntry(maps, seasonKey, hourId) {
  if (!maps) return null
  var season = maps[seasonKey] || maps.trinity || {}
  return season[hourId] || season.default || (maps.trinity && (maps.trinity[hourId] || maps.trinity.default)) || null
}

function collectMatches(collect, day, hourId) {
  if (!collect) return false
  if (collect.hours && collect.hours.length && collect.hours.indexOf(hourId) < 0) return false
  if (collect.weekdays && collect.weekdays.length && collect.weekdays.indexOf(day.weekday) < 0) return false
  if (collect.seasons && collect.seasons.length && collect.seasons.indexOf(day.seasonKey) < 0) return false
  if (collect.week !== undefined && collect.week !== null && collect.week !== day.weekNumber) return false
  return true
}

function pickCollect(book, day, hour, salt) {
  var pool = []
  var list = book && Array.isArray(book.collects) ? book.collects : []
  for (var i = 0; i < list.length; i++) {
    if (collectMatches(list[i], day, hour && hour.id)) pool.push(list[i])
  }
  if (hour && hour.prayer) {
    pool.push({ id: hour.id + "-hour", title: hour.name, text: hour.prayer })
  }
  if (pool.length === 0) return null
  return pool[nextPosition(-1, pool.length, "random", salt)]
}

function pickMemorial(book, day) {
  var list = book && Array.isArray(book.memorials) ? book.memorials : []
  var fallback = null
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    if (item.weekdays && item.weekdays.indexOf(day.weekday) >= 0) return item
    if (!item.weekdays || item.weekdays.length === 0) fallback = item
  }
  return fallback
}

function buildOffice(now, hour, book, salt) {
  var day = liturgicalDay(now)
  hour = hour || hourById("morning")
  var chapter = lookupHourEntry(book && book.chapters, day.seasonKey, hour.id)
  var respond = lookupHourEntry(book && book.responds, day.seasonKey, hour.id)
  var collect = pickCollect(book, day, hour, String(salt || day.date) + (hour.id || "") + "collect")
  var memorial = pickMemorial(book, day)
  var heading = day.spoken
  if (day.feast) heading += ", " + day.feast
  var sections = []
  if (chapter) {
    sections.push({
      label: "The Chapter",
      body: (chapter.reference ? chapter.reference + "\n" : "") + (chapter.text || "")
    })
  }
  if (respond) {
    sections.push({
      label: "The Short Respond",
      body: [respond.respond, respond.verse, "Glory be to the Father, and to the Son, and to the Holy Spirit."].filter(Boolean).join("\n")
    })
  }
  if (collect) {
    sections.push({
      label: "Collect",
      body: collect.text || ""
    })
  }
  if (memorial) {
    sections.push({
      label: "Memorial Collect",
      body: (memorial.title ? memorial.title + "\n" : "") + (memorial.text || "")
    })
  }
  return {
    spoken: day.spoken,
    heading: heading,
    feast: day.feast,
    seasonKey: day.seasonKey,
    weekNumber: day.weekNumber,
    weekday: day.weekday,
    hourId: hour.id,
    hourName: hour.name,
    hourShortName: hour.shortName,
    chapter: chapter,
    respond: respond,
    collect: collect,
    memorial: memorial,
    sections: sections
  }
}

function officeNotificationBody(office) {
  if (!office) return "The Office is not ready yet."
  var lines = [office.heading]
  if (office.hourName) lines.push(office.hourName)
  for (var i = 0; i < (office.sections || []).length; i++) {
    var section = office.sections[i]
    lines.push("")
    lines.push(section.label.toUpperCase())
    lines.push(section.body)
  }
  return lines.join("\n")
}

if (typeof module !== "undefined") {
  module.exports = {
    HOURS: HOURS,
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
    fileUrlToPath: fileUrlToPath,
    catalogVerses: catalogVerses,
    verseFromCatalog: verseFromCatalog,
    featuredHour: featuredHour,
    heroMeta: heroMeta,
    hourById: hourById,
    resolvedHours: resolvedHours,
    enabledHours: enabledHours,
    scheduleState: scheduleState,
    isCurrentWindow: isCurrentWindow,
    dueNotifications: dueNotifications,
    notificationTitle: notificationTitle,
    hourNotificationTitles: hourNotificationTitles,
    pluginNotificationTitles: pluginNotificationTitles,
    notificationBody: notificationBody,
    verseForPosition: verseForPosition,
    easterDate: easterDate,
    liturgicalDay: liturgicalDay,
    officeNotificationTitle: officeNotificationTitle,
    buildOffice: buildOffice,
    officeNotificationBody: officeNotificationBody
  }
}

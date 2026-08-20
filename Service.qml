import QtQuick
import Quickshell
import Quickshell.Io
import "Model.js" as Model

// Persistent office state. Verse cache lives under ~/.local/state/omarchy
// (same convention as the Bible Verse and Canon plugins) so it survives
// plugin updates. A timer watches local clock time and fires one desktop
// reminder per enabled hour per day.
Item {
  id: root
  property var settings: ({})
  readonly property string home: Quickshell.env("HOME")
  readonly property string omarchyPath: Quickshell.env("OMARCHY_PATH")
  readonly property string stateDir: home + "/.local/state/omarchy/settings/"
  readonly property string cachePath: stateDir + "liturgy-of-the-hours.json"
  readonly property string iconPath: Qt.resolvedUrl("icon.png").toString().replace(/^file:\/\//, "")
  readonly property string translation: Model.choice(setting("translation", "web"), Model.translationCodes(), "web")
  readonly property bool notificationsEnabled: Model.boolSetting(setting("notificationsEnabled", true), true)
  readonly property var schedule: Model.scheduleState(clock.date, settings)
  readonly property var currentHour: schedule.current
  readonly property var nextHour: schedule.next
  readonly property bool hourIsNow: Model.isCurrentWindow(currentHour, schedule.nowMinutes, nextHour, 20)

  property bool loaded: false
  property bool loading: false
  property string lastError: ""
  property int versePosition: -1
  property string cachedDate: ""
  property string cachedTranslation: ""
  property var lastNotified: ({})
  property string verseReference: ""
  property string verseText: ""
  property string verseTranslation: ""
  property string selectedHourId: ""
  property string fetchOutput: ""

  readonly property var selectedHour: {
    var id = selectedHourId
    var hours = schedule.all || []
    for (var i = 0; i < hours.length; i++) if (hours[i].id === id) return hours[i]
    return hourIsNow ? currentHour : nextHour
  }
  readonly property string statusText: loading ? "Loading…" : (verseReference !== "" ? verseReference : (lastError !== "" ? lastError : "Liturgy of the Hours"))
  readonly property string tooltipText: {
    if (hourIsNow && currentHour) return currentHour.name + " · now"
    if (nextHour) {
      var until = Model.formatUntil(schedule.nowMinutes, nextHour.minutes, nextHour.tomorrow)
      return nextHour.name + " " + until + " (" + nextHour.time + ")"
    }
    return "Liturgy of the Hours"
  }

  SystemClock {
    id: clock
    precision: SystemClock.Minutes
    onDateChanged: root.refreshIfStale()
  }

  onTranslationChanged: root.refreshIfStale()

  function setting(name, fallback) {
    var v = settings ? settings[name] : undefined
    return v === undefined || v === null ? fallback : v
  }

  function parse(raw, fallback) {
    try { return JSON.parse(String(raw || "")) } catch (e) { return fallback }
  }

  function todayIso() { return Model.isoDate(clock.date) }

  function saveCache() {
    cacheFile.setText(JSON.stringify({
      date: cachedDate,
      translation: cachedTranslation,
      verse_position: versePosition,
      reference: verseReference,
      text: verseText,
      translationName: verseTranslation,
      last_notified: lastNotified
    }, null, 2) + "\n")
  }

  function applyCache(raw) {
    var data = parse(raw, {})
    cachedDate = String(data.date || "")
    cachedTranslation = String(data.translation || "")
    versePosition = data.verse_position === undefined ? -1 : Number(data.verse_position)
    if (data.reference) verseReference = String(data.reference)
    if (data.text) verseText = String(data.text)
    if (data.translationName) verseTranslation = String(data.translationName)
    lastNotified = data.last_notified && typeof data.last_notified === "object" ? data.last_notified : ({})
    loaded = true
    refreshIfStale()
    Qt.callLater(checkHours)
  }

  function advanceIfNeeded() {
    var date = todayIso()
    if (cachedDate === date && versePosition >= 0) return
    versePosition = Model.nextPosition(versePosition, Model.VERSES.length, setting("verseSequence", "sequential"), date + "v")
  }

  function refreshIfStale() {
    if (!loaded || bibleProc.running) return
    var date = todayIso()
    if (cachedDate === date && cachedTranslation === translation && verseText !== "") return
    advanceIfNeeded()
    fetchVerse()
  }

  function load(force) {
    if (force === true) {
      cachedTranslation = ""
      fetchVerse()
      return
    }
    if (!loaded) return
    refreshIfStale()
  }

  function fetchVerse() {
    if (bibleProc.running) return
    loading = true
    lastError = ""
    var ref = Model.verseForPosition(versePosition)
    bibleProc.requestedReference = ref
    bibleProc.requestedTranslation = translation
    bibleProc.requestedDate = todayIso()
    bibleProc.command = ["curl", "-fsS", "--max-time", "8", Model.bibleUrl(ref, translation)]
    bibleProc.running = true
  }

  function selectHour(id) { selectedHourId = id || "" }

  function notifyHour(hour) {
    if (!hour) return
    var args = [
      omarchyPath + "/bin/omarchy-notification-send",
      "--app-name", "Liturgy of the Hours",
      "-u", "normal",
      "-g", "☩",
      "--exec", "omarchy-shell shell summon io.github.mohuddle.liturgy-of-the-hours '{}'"
    ]
    if (iconPath !== "") { args.push("--image"); args.push(iconPath) }
    args.push(Model.notificationTitle(hour))
    args.push(Model.notificationBody(hour, verseReference))
    Quickshell.execDetached(args)
    var next = ({})
    for (var key in lastNotified) next[key] = lastNotified[key]
    next[hour.id] = todayIso()
    lastNotified = next
    saveCache()
  }

  function checkHours() {
    if (!notificationsEnabled || !loaded) return
    var due = Model.dueNotifications(clock.date, settings, lastNotified || {}, 5)
    for (var i = 0; i < due.length; i++) notifyHour(due[i])
  }

  function notifyVerse() {
    Quickshell.execDetached([
      omarchyPath + "/bin/omarchy-notification-send",
      "--app-name", "Liturgy of the Hours",
      "-u", "low",
      "-g", "☩",
      "--image", iconPath,
      verseReference !== "" ? verseReference : "Today’s Scripture",
      verseText !== "" ? verseText : (lastError !== "" ? lastError : "Still loading today’s verse…")
    ])
  }

  function announceNext() {
    var hour = hourIsNow ? currentHour : nextHour
    if (!hour) return
    Quickshell.execDetached([
      omarchyPath + "/bin/omarchy-notification-send",
      "--app-name", "Liturgy of the Hours",
      "-u", "low",
      "-g", "☩",
      "--image", iconPath,
      hourIsNow ? (hour.name + " · now") : (hour.name + " " + Model.formatUntil(schedule.nowMinutes, hour.minutes, hour.tomorrow)),
      hour.hymn || hour.invitatory
    ])
  }

  Timer {
    interval: 15000
    running: true
    repeat: true
    triggeredOnStart: true
    onTriggered: root.checkHours()
  }

  Timer {
    interval: 3600000
    running: true
    repeat: true
    onTriggered: root.refreshIfStale()
  }

  Process {
    id: ensureDir
    command: ["mkdir", "-p", root.stateDir]
    onExited: function(code) {
      if (code !== 0) { root.lastError = "Couldn’t create the hours state directory."; return }
      cacheFile.reload()
    }
  }

  Process {
    id: bibleProc
    property string requestedReference: ""
    property string requestedTranslation: ""
    property string requestedDate: ""
    stdout: StdioCollector { id: bibleOut; waitForEnd: true; onStreamFinished: root.fetchOutput = text }
    onExited: function(code) {
      root.loading = false
      if (code !== 0) {
        root.lastError = "Couldn’t reach bible-api.com"
        Qt.callLater(root.refreshIfStale)
        return
      }
      var value = Model.parseBible(bibleOut.text || root.fetchOutput, bibleProc.requestedReference, bibleProc.requestedTranslation)
      if (value && value.text !== "") {
        root.verseReference = value.reference
        root.verseText = value.text
        root.verseTranslation = value.translation
        root.cachedDate = bibleProc.requestedDate
        root.cachedTranslation = bibleProc.requestedTranslation
        root.lastError = ""
        root.saveCache()
      } else root.lastError = "Couldn’t parse the Scripture response."
      Qt.callLater(root.refreshIfStale)
    }
  }

  property FileView cacheFile: FileView {
    path: root.cachePath
    atomicWrites: true
    printErrors: false
    onLoaded: root.applyCache(text())
    onLoadFailed: {
      root.loaded = true
      root.refreshIfStale()
      Qt.callLater(root.checkHours)
    }
  }

  Component.onCompleted: ensureDir.running = true
}

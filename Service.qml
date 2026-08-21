import QtQuick
import Quickshell
import Quickshell.Io
import "Model.js" as Model

// Persistent office state. Daily Scripture is the bundled Berean Standard
// Bible catalogue (data/verses.json), so nothing is fetched at runtime.
Item {
  id: root
  property var settings: ({})
  readonly property string home: Quickshell.env("HOME")
  readonly property string omarchyPath: Quickshell.env("OMARCHY_PATH")
  readonly property string stateDir: home + "/.local/state/omarchy/settings/"
  readonly property string cachePath: stateDir + "liturgy-of-the-hours.json"
  readonly property string iconPath: Qt.resolvedUrl("icon.png").toString().replace(/^file:\/\//, "")
  readonly property string versesPath: Model.fileUrlToPath(Qt.resolvedUrl("data/verses.json"))
  readonly property string officePath: Model.fileUrlToPath(Qt.resolvedUrl("data/office.json"))
  readonly property string bellPath: Model.fileUrlToPath(Qt.resolvedUrl("data/church-bell.ogg"))
  readonly property bool notificationsEnabled: Model.boolSetting(setting("notificationsEnabled", true), true)
  readonly property var schedule: Model.scheduleState(clock.date, settings)
  readonly property var currentHour: schedule.current
  readonly property var nextHour: schedule.next
  readonly property var featured: Model.featuredHour(schedule)
  readonly property bool hourIsNow: Model.isCurrentWindow(currentHour, schedule.nowMinutes, nextHour, 20)
  readonly property string heroMeta: Model.heroMeta(featured)

  property bool loaded: false
  property var catalog: ({ verses: [] })
  property string lastError: ""
  property int versePosition: -1
  property string cachedDate: ""
  property string cachedTranslation: ""
  property var lastNotified: ({})
  property string verseReference: ""
  property string verseText: ""
  property string selectedHourId: ""
  property var officeBook: ({})
  property var office: null
  readonly property string verseTranslation: "Berean Standard Bible"
  readonly property int catalogLength: Model.catalogVerses(catalog).length
  readonly property string statusText: verseReference !== "" ? verseReference : (lastError !== "" ? lastError : "Liturgy of the Hours")
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
    lastNotified = data.last_notified && typeof data.last_notified === "object" ? data.last_notified : ({})
    loaded = true
    refreshIfStale()
    Qt.callLater(checkHours)
  }

  function advanceIfNeeded() {
    var date = todayIso()
    var length = catalogLength || Model.VERSES.length
    if (cachedDate === date && versePosition >= 0) return
    versePosition = Model.nextPosition(versePosition, length, setting("verseSequence", "sequential"), date + "v")
  }

  function applyToday() {
    advanceIfNeeded()
    var rec = Model.verseFromCatalog(catalog, versePosition)
    if (!rec) {
      lastError = catalogLength === 0 ? "Couldn’t load today’s Scripture." : "No Scripture for today."
      return
    }
    verseReference = rec.reference
    verseText = rec.text
    cachedDate = todayIso()
    cachedTranslation = "bsb"
    lastError = ""
    saveCache()
  }

  function refreshIfStale() {
    if (!loaded || catalogLength === 0) return
    if (cachedDate === todayIso() && cachedTranslation === "bsb" && verseText !== "") return
    applyToday()
  }

  function load(force) {
    if (catalogLength === 0) {
      versesFile.reload()
      return
    }
    if (force === true) {
      cachedDate = ""
      applyToday()
      return
    }
    if (!loaded) return
    refreshIfStale()
  }

  function selectHour(id) { selectedHourId = id || "" }

  function playBell() {
    if (bellPath === "") return
    Quickshell.execDetached([
      "sh", "-c",
      'if command -v pw-play >/dev/null 2>&1; then pw-play --media-role Notification --volume 0.65 "$1"; elif command -v paplay >/dev/null 2>&1; then paplay "$1"; fi',
      "loth-bell",
      bellPath
    ])
  }

  function dismissTitles(titles) {
    var list = titles || []
    for (var i = 0; i < list.length; i++) {
      Quickshell.execDetached([
        omarchyPath + "/bin/omarchy-notification-dismiss",
        list[i]
      ])
    }
  }

  function dismissHourNotifications() {
    dismissTitles(Model.hourNotificationTitles())
  }

  function dismissPluginNotifications() {
    dismissTitles(Model.pluginNotificationTitles())
  }

  function prepareOffice() {
    root.office = Model.buildOffice(clock.date, featured, root.officeBook, todayIso())
    return root.office
  }

  function notifyOfficeToast() {
    var built = prepareOffice()
    var args = [
      omarchyPath + "/bin/omarchy-notification-send",
      "--app-name", "Liturgy of the Hours",
      "-u", "critical",
      "-g", "󰂚",
      "--exec", "omarchy-shell io.github.mohuddle.liturgy-of-the-hours office"
    ]
    if (iconPath !== "") { args.push("--image"); args.push(iconPath) }
    args.push(Model.officeNotificationTitle())
    args.push(Model.officeNotificationBody(built))
    Quickshell.execDetached(args)
  }

  function notifyHour(hour) {
    if (!hour) return
    var args = [
      omarchyPath + "/bin/omarchy-notification-send",
      "--app-name", "Liturgy of the Hours",
      "-u", "critical",
      "-g", "☩",
      "--exec", "omarchy-shell shell summon io.github.mohuddle.liturgy-of-the-hours '{}'"
    ]
    if (iconPath !== "") { args.push("--image"); args.push(iconPath) }
    args.push(Model.notificationTitle(hour))
    args.push(Model.notificationBody(hour, verseReference))
    playBell()
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
      verseText !== "" ? verseText : (lastError !== "" ? lastError : "Today’s Scripture is not ready yet.")
    ])
  }

  Timer {
    interval: 15000
    running: true
    repeat: true
    triggeredOnStart: true
    onTriggered: root.checkHours()
  }

  Process {
    id: ensureDir
    command: ["mkdir", "-p", root.stateDir]
    onExited: function(code) {
      if (code !== 0) { root.lastError = "Couldn’t create the hours state directory."; return }
      versesFile.reload()
      officeFile.reload()
      cacheFile.reload()
    }
  }

  property FileView versesFile: FileView {
    path: root.versesPath
    printErrors: false
    onLoaded: {
      root.catalog = root.parse(text(), { verses: [] })
      if (root.loaded) root.refreshIfStale()
    }
    onLoadFailed: root.lastError = "Couldn’t load the bundled BSB catalogue."
  }

  property FileView officeFile: FileView {
    path: root.officePath
    printErrors: false
    onLoaded: root.officeBook = root.parse(text(), {})
    onLoadFailed: root.officeBook = ({})
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

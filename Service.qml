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
  readonly property string cachePath: home + "/.local/state/omarchy/settings/liturgy-of-the-hours.json"
  readonly property string helperPath: Model.fileUrlToPath(Qt.resolvedUrl("bin/hours-store.py"))
  readonly property string iconPath: Qt.resolvedUrl("icon.png").toString().replace(/^file:\/\//, "")
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
  property bool ignoreOwnWrite: false
  property var storeQueue: []
  property string storeOp: "read-cache"
  property string pendingPayload: ""
  property string outBuf: ""
  property string errBuf: ""
  readonly property string verseTranslation: "Berean Standard Bible"
  readonly property int catalogLength: Model.catalogVerses(catalog).length
  readonly property string statusText: verseReference !== "" ? verseReference : (lastError !== "" ? lastError : "Liturgy of the Hours")
  readonly property string tooltipText: {
    var text = "Liturgy of the Hours"
    if (hourIsNow && currentHour) text = currentHour.name + " · now"
    else if (nextHour) {
      var until = Model.formatUntil(schedule.nowMinutes, nextHour.minutes, nextHour.tomorrow)
      text = nextHour.name + " " + until + " (" + nextHour.time + ")"
    }
    return Model.plainText(text, 120)
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

  function notifyBin(name) {
    var base = String(omarchyPath || "")
    if (base.charAt(0) !== "/" || base.indexOf("..") !== -1) return ""
    return base + "/bin/" + name
  }

  function todayIso() { return Model.isoDate(clock.date) }

  function enqueue(op, payload) {
    storeQueue = storeQueue.concat([{ op: op, payload: payload || "" }])
    kickStore()
  }

  function kickStore() {
    if (storeProc.running || storeQueue.length === 0) return
    var job = storeQueue[0]
    var rest = []
    for (var i = 1; i < storeQueue.length; i++) rest.push(storeQueue[i])
    storeQueue = rest
    if (job.op === "write-cache") ignoreOwnWrite = true
    storeOp = job.op
    pendingPayload = job.payload || ""
    outBuf = ""
    errBuf = ""
    storeProc.running = true
  }

  function saveCache() {
    enqueue("write-cache", Model.serializeCache({
      date: cachedDate,
      translation: cachedTranslation,
      verse_position: versePosition,
      reference: verseReference,
      text: verseText,
      last_notified: lastNotified
    }))
  }

  function applyCache(raw) {
    var data = Model.parseCache(raw)
    if (data === null) {
      lastError = "Couldn’t parse reminder state."
      return
    }
    cachedDate = data.date
    cachedTranslation = data.translation
    versePosition = data.verse_position
    if (data.reference) verseReference = data.reference
    if (data.text) verseText = data.text
    lastNotified = data.last_notified
    loaded = true
    lastError = ""
    refreshIfStale()
    Qt.callLater(checkHours)
  }

  function applyCatalog(raw) {
    try {
      var parsed = JSON.parse(String(raw || ""))
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.verses)) {
        lastError = "Couldn’t load today’s Scripture."
        return
      }
      catalog = parsed
      if (loaded) refreshIfStale()
    } catch (e) {
      lastError = "Couldn’t load today’s Scripture."
    }
  }

  function applyOfficeBook(raw) {
    try {
      var parsed = JSON.parse(String(raw || ""))
      officeBook = parsed && typeof parsed === "object" ? parsed : ({})
    } catch (e) {
      officeBook = ({})
    }
  }

  function finishStore(code) {
    deadline.stop()
    killTimer.stop()
    if (storeOp === "write-cache") {
      if (code !== 0) ignoreOwnWrite = false
      else ownWriteTimer.restart()
      kickStore()
      return
    }
    if (code !== 0) {
      lastError = errBuf !== "" ? errBuf.replace(/\s+$/, "") : "Couldn’t read office data."
      kickStore()
      return
    }
    if (storeOp === "read-verses") applyCatalog(outBuf)
    else if (storeOp === "read-office") applyOfficeBook(outBuf)
    else applyCache(outBuf)
    kickStore()
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
      enqueue("read-verses", "")
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
    if (bellPath === "" || bellPath.indexOf("..") !== -1) return
    Quickshell.execDetached(["/usr/bin/pw-play", "--media-role", "Notification", "--volume", "0.65", "--", bellPath])
  }

  function dismissTitles(titles) {
    var bin = notifyBin("omarchy-notification-dismiss")
    if (bin === "") return
    var list = titles || []
    for (var i = 0; i < list.length; i++) {
      Quickshell.execDetached([bin, "--", list[i]])
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
    var bin = notifyBin("omarchy-notification-send")
    if (bin === "") return
    var args = [
      bin,
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
    var bin = notifyBin("omarchy-notification-send")
    if (bin === "") return
    var args = [
      bin,
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
    var bin = notifyBin("omarchy-notification-send")
    if (bin === "") return
    Quickshell.execDetached([
      bin,
      "--app-name", "Liturgy of the Hours",
      "-u", "low",
      "-g", "☩",
      "--image", iconPath,
      verseReference !== "" ? verseReference : "Today’s Scripture",
      verseText !== "" ? Model.plainText(verseText, Model.MAX_NOTIFY) : (lastError !== "" ? Model.plainText(lastError, 200) : "Today’s Scripture is not ready yet.")
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
    id: deadline
    interval: 15000
    repeat: false
    onTriggered: {
      storeProc.signal(15)
      killTimer.start()
    }
  }

  Timer {
    id: killTimer
    interval: 2000
    repeat: false
    onTriggered: storeProc.signal(9)
  }

  Timer {
    id: ownWriteTimer
    interval: 400
    repeat: false
    onTriggered: root.ignoreOwnWrite = false
  }

  Process {
    id: storeProc
    command: ["/usr/bin/python3", "-I", "-S", root.helperPath, root.storeOp]
    clearEnvironment: true
    environment: ({
      "HOME": root.home || "",
      "PATH": "/usr/bin",
      "LC_ALL": "C"
    })
    stdinEnabled: root.storeOp === "write-cache"
    stdout: SplitParser {
      splitMarker: ""
      onRead: function(chunk) {
        root.outBuf += chunk
        var cap = root.storeOp === "write-cache" ? Model.MAX_CACHE_BYTES : Model.MAX_DATA_BYTES
        if (root.outBuf.length > cap) {
          storeProc.signal(15)
          killTimer.start()
        }
      }
    }
    stderr: SplitParser {
      splitMarker: ""
      onRead: function(chunk) {
        root.errBuf += chunk
        if (root.errBuf.length > 200)
          root.errBuf = root.errBuf.substring(0, 200)
      }
    }
    onStarted: {
      deadline.restart()
      if (root.storeOp === "write-cache") storeProc.write(root.pendingPayload)
    }
    onExited: function(code) { root.finishStore(code) }
  }

  FileView {
    path: root.loaded ? root.cachePath : ""
    preload: false
    watchChanges: true
    blockAllReads: true
    printErrors: false
    onFileChanged: if (!root.ignoreOwnWrite) root.enqueue("read-cache", "")
  }

  Component.onCompleted: {
    enqueue("read-verses", "")
    enqueue("read-office", "")
    enqueue("read-cache", "")
  }

  Component.onDestruction: {
    if (storeProc.running) {
      storeProc.signal(15)
      killTimer.start()
    }
  }
}

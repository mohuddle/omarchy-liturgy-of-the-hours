import QtQuick
import Quickshell
import qs.Commons
import qs.Ui
import "Model.js" as Model

// Hours schedule, the office of the selected hour, and today's Scripture
// are stacked as separate sections so a collect is never mistaken for
// the daily Bible verse. Layout follows Canon (native Button/TextField,
// Color.accent/muted) and Bible Verse of the Day (PanelHero + verse).
Panel {
  id: root
  moduleName: "io.github.mohuddle.liturgy-of-the-hours"
  ipcTarget: "io.github.mohuddle.liturgy-of-the-hours"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null
  property var service: null
  property bool showingSettings: false
  property string translationSearch: ""
  readonly property var barIdentity: hostWidget || root
  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color muted: Color.muted
  readonly property color accent: Color.accent
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family
  readonly property var translations: Model.TRANSLATIONS
  readonly property var schedule: service ? service.schedule : ({ hours: [], all: [], current: null, next: null, nowMinutes: 0 })
  readonly property var selectedHour: service ? service.selectedHour : null
  readonly property string heroTitle: root.showingSettings ? "Hours settings" : "Liturgy of the Hours"
  readonly property string heroMeta: {
    if (root.showingSettings) return "Changes are saved to your Omarchy bar entry"
    if (root.service && root.service.hourIsNow && root.service.currentHour)
      return root.service.currentHour.name + " · now"
    if (root.service && root.service.nextHour)
      return root.service.nextHour.name + " " + Model.formatUntil(root.schedule.nowMinutes, root.service.nextHour.minutes, root.service.nextHour.tomorrow)
    return "Canonical hours"
  }

  function hasSavedSettings() {
    if (!settings) return false
    for (var key in settings) if (key !== "id") return true
    return false
  }
  function open() {
    controller.show()
    if (!hasSavedSettings()) showingSettings = true
    if (service) service.load()
    Qt.callLater(function() {
      if (root.opened) setCenterHoverRevealSuppressed(true)
    })
  }
  function close() {
    setCenterHoverRevealSuppressed(false)
    controller.hide()
  }
  function toggle() { if (opened) close(); else open() }
  function switchPanel(direction) {
    if (bar && typeof bar.switchPanelFrom === "function") return bar.switchPanelFrom(barIdentity, direction)
    return false
  }
  function setCenterHoverRevealSuppressed(value) {
    if (root.bar && "centerHoverRevealSuppressed" in root.bar)
      root.bar.centerHoverRevealSuppressed = value
  }
  function refresh() { if (service) service.load(true) }
  function setting(name, fallback) {
    var value = settings ? settings[name] : undefined
    return value === undefined || value === null ? fallback : value
  }
  function persist(values) {
    var entry = { id: moduleName }
    for (var key in settings) if (key !== "id") entry[key] = settings[key]
    for (var changed in values) entry[changed] = values[changed]
    settings = entry
    if (hostWidget && "settings" in hostWidget) hostWidget.settings = entry
    if (bar && bar.shell && typeof bar.shell.updateEntryInline === "function") bar.shell.updateEntryInline(moduleName, entry)
    if (service) service.load()
  }
  function cycle(key, values) {
    var current = String(setting(key, values[0]))
    var index = values.indexOf(current)
    persist((function() { var result = {}; result[key] = values[(index + 1 + values.length) % values.length]; return result })())
  }
  function suggestedSettings() {
    return {
      translation: "web",
      verseSequence: "sequential",
      notificationsEnabled: true,
      morningEnabled: true, morningTime: "06:00",
      primeEnabled: true, primeTime: "07:00",
      terceEnabled: true, terceTime: "09:00",
      sextEnabled: true, sextTime: "12:00",
      noneEnabled: true, noneTime: "15:00",
      eveningEnabled: true, eveningTime: "18:00"
    }
  }
  function hourTime(id, fallback) { return Model.parseHm(setting(id + "Time", fallback), fallback) }
  function hourEnabled(id) { return Model.boolSetting(setting(id + "Enabled", true), true) }
  function setHourTime(id, text) {
    persist((function() { var result = {}; result[id + "Time"] = Model.parseHm(text, hourTime(id, "06:00")); return result })())
  }
  function toggleHour(id) {
    persist((function() { var result = {}; result[id + "Enabled"] = !hourEnabled(id); return result })())
  }
  function hourUntil(hour) {
    if (!hour) return ""
    if (service && service.hourIsNow && service.currentHour && service.currentHour.id === hour.id) return "now"
    return Model.formatUntil(schedule.nowMinutes, hour.minutes, hour.tomorrow)
  }
  function hourColor(hour) {
    if (!hour) return muted
    if (selectedHour && selectedHour.id === hour.id) return accent
    if (service && service.hourIsNow && service.currentHour && service.currentHour.id === hour.id) return accent
    if (schedule.current && hour.minutes <= schedule.nowMinutes) return muted
    return foreground
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.barIdentity
    bar: root.bar
    open: root.opened
    centerOnBar: false
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(390))
    contentHeight: panel.fittedContentHeight(column.implicitHeight, Style.space(560))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      blocked: translationField.activeFocus
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }
      onTextKey: function(t) { if (t === "r" || t === "R") root.refresh() }

      Flickable {
        anchors.fill: parent
        contentWidth: width
        contentHeight: column.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds

        Column {
          id: column
          width: parent.width
          spacing: Style.space(10)

          Row {
            width: parent.width
            spacing: Style.space(8)
            PanelHero {
              width: parent.width - gear.width - Style.space(8)
              title: root.heroTitle
              meta: root.heroMeta
              foreground: root.foreground
              fontFamily: root.fontFamily
              iconComponent: Component {
                JerusalemCross {
                  size: Style.font.display
                  foreground: root.accent
                }
              }
            }
            Button {
              id: gear
              width: Style.space(32)
              implicitHeight: Style.space(32)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: ""
              selected: root.showingSettings
              bordered: true
              foreground: root.foreground
              tooltipText: "Settings"
              onClicked: root.showingSettings = !root.showingSettings
            }
          }

          Item {
            visible: !root.showingSettings
            width: parent.width
            height: officeColumn.implicitHeight
            Column {
              id: officeColumn
              width: parent.width
              spacing: Style.space(10)

              Text {
                textFormat: Text.PlainText
                text: "THE HOURS"
                color: root.muted
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                font.bold: true
              }

              Repeater {
                model: root.schedule.hours
                delegate: Item {
                  required property var modelData
                  width: officeColumn.width
                  height: hourColumn.implicitHeight + Style.space(6)

                  Column {
                    id: hourColumn
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: Style.space(2)
                    Row {
                      width: parent.width
                      spacing: Style.space(8)
                      Text {
                        textFormat: Text.PlainText
                        text: modelData.shortName
                        color: root.hourColor(modelData)
                        font.family: root.fontFamily
                        font.pixelSize: Style.font.body
                        font.bold: true
                      }
                      Item { width: Math.max(0, parent.width - parent.children[0].implicitWidth - parent.children[2].implicitWidth - Style.space(16)); height: 1 }
                      Text {
                        textFormat: Text.PlainText
                        text: modelData.time
                        color: root.hourColor(modelData)
                        font.family: root.fontFamily
                        font.pixelSize: Style.font.body
                      }
                    }
                    Text {
                      textFormat: Text.PlainText
                      width: parent.width
                      text: modelData.latin + " · " + modelData.traditional + " · " + root.hourUntil(modelData)
                      color: root.muted
                      font.family: root.fontFamily
                      font.pixelSize: Style.font.caption
                      wrapMode: Text.WordWrap
                    }
                  }
                  MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: { if (root.service) root.service.selectHour(modelData.id) }
                  }
                }
              }

              PanelSeparator { foreground: root.foreground }

              Text {
                visible: root.selectedHour !== null
                textFormat: Text.PlainText
                text: root.selectedHour ? root.selectedHour.name.toUpperCase() : ""
                color: root.muted
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                font.bold: true
              }
              Text {
                visible: root.selectedHour !== null
                width: parent.width
                textFormat: Text.PlainText
                text: root.selectedHour ? root.selectedHour.invitatory : ""
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                wrapMode: Text.WordWrap
              }
              Text {
                visible: root.selectedHour !== null
                width: parent.width
                textFormat: Text.PlainText
                text: root.selectedHour ? root.selectedHour.hymn : ""
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                wrapMode: Text.WordWrap
              }
              Text {
                visible: root.selectedHour !== null && root.selectedHour.psalm !== ""
                width: parent.width
                textFormat: Text.PlainText
                text: root.selectedHour ? (root.selectedHour.psalm + " — " + root.selectedHour.psalmText) : ""
                color: root.muted
                font.family: root.fontFamily
                font.pixelSize: Style.font.bodySmall
                wrapMode: Text.WordWrap
              }
              Text {
                visible: root.selectedHour !== null
                width: parent.width
                textFormat: Text.PlainText
                text: root.selectedHour ? root.selectedHour.prayer : ""
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                wrapMode: Text.WordWrap
              }

              PanelSeparator { foreground: root.foreground }

              Text {
                textFormat: Text.PlainText
                text: "TODAY’S SCRIPTURE"
                color: root.muted
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                font.bold: true
              }
              Text {
                width: parent.width
                textFormat: Text.PlainText
                text: root.service ? root.service.verseReference : ""
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.subtitle
                font.bold: true
                wrapMode: Text.WordWrap
              }
              Text {
                width: parent.width
                textFormat: Text.PlainText
                text: root.service && root.service.verseText !== "" ? root.service.verseText
                  : (root.service && root.service.loading ? "Loading…" : (root.service && root.service.lastError !== "" ? root.service.lastError : "Scripture will appear here."))
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                wrapMode: Text.WordWrap
              }
              Text {
                visible: root.service && root.service.verseTranslation !== ""
                textFormat: Text.PlainText
                text: (root.service ? root.service.verseTranslation : "") + " · bible-api.com"
                color: root.muted
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
              }
              Text {
                visible: root.service && root.service.lastError !== "" && root.service.verseText !== ""
                width: parent.width
                textFormat: Text.PlainText
                text: root.service ? root.service.lastError : ""
                color: root.muted
                font.family: root.fontFamily
                font.pixelSize: Style.font.bodySmall
                wrapMode: Text.WordWrap
              }

              Button {
                width: parent.width
                text: "Refresh Scripture"
                bordered: true
                foreground: root.foreground
                onClicked: root.refresh()
              }
            }
          }

          Item {
            visible: root.showingSettings
            width: parent.width
            height: settingsColumn.implicitHeight
            Column {
              id: settingsColumn
              width: parent.width
              spacing: Style.space(8)

              Text {
                visible: !root.hasSavedSettings()
                width: parent.width
                textFormat: Text.PlainText
                text: "Welcome — set the times for Morning and Evening Prayer and the little hours of Prime, Terce, Sext, and None. Suggested times follow the traditional daytime offices."
                color: root.muted
                font.family: root.fontFamily
                font.pixelSize: Style.font.bodySmall
                wrapMode: Text.WordWrap
              }
              Button {
                visible: !root.hasSavedSettings()
                text: "Use suggested hours"
                bordered: true
                foreground: root.foreground
                onClicked: root.persist(root.suggestedSettings())
              }

              Button {
                width: parent.width
                text: root.setting("notificationsEnabled", true) ? "Hour reminders on" : "Hour reminders off"
                selected: root.setting("notificationsEnabled", true)
                bordered: true
                foreground: root.foreground
                onClicked: root.persist({ notificationsEnabled: !root.setting("notificationsEnabled", true) })
              }
              Button {
                width: parent.width
                text: "Scripture: " + root.setting("verseSequence", "sequential")
                bordered: true
                foreground: root.foreground
                onClicked: root.cycle("verseSequence", ["sequential", "random"])
              }

              Repeater {
                model: Model.HOURS
                delegate: Column {
                  required property var modelData
                  width: settingsColumn.width
                  spacing: Style.space(4)
                  Row {
                    width: parent.width
                    spacing: Style.space(8)
                    Button {
                      width: parent.width - timeField.width - parent.spacing
                      text: modelData.name + (root.hourEnabled(modelData.id) ? "" : " · off")
                      selected: root.hourEnabled(modelData.id)
                      bordered: true
                      foreground: root.foreground
                      onClicked: root.toggleHour(modelData.id)
                    }
                    TextField {
                      id: timeField
                      width: Style.space(88)
                      foreground: root.foreground
                      text: root.hourTime(modelData.id, modelData.defaultTime)
                      placeholderText: modelData.defaultTime
                      onEditingFinished: root.setHourTime(modelData.id, text)
                    }
                  }
                }
              }

              Text {
                textFormat: Text.PlainText
                text: "Bible translation"
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
              }
              TextField {
                id: translationField
                width: parent.width
                foreground: root.foreground
                placeholderText: "web, kjv, asv…"
                text: root.translationSearch
                onTextChanged: root.translationSearch = text
                Keys.onReturnPressed: {
                  if (text.trim() !== "") root.persist({ translation: text.trim().toLowerCase() })
                }
                Keys.onEnterPressed: {
                  if (text.trim() !== "") root.persist({ translation: text.trim().toLowerCase() })
                }
              }
              Repeater {
                model: root.translations
                delegate: Button {
                  required property var modelData
                  visible: root.translationSearch === "" || modelData.code.indexOf(root.translationSearch.toLowerCase()) >= 0 || modelData.name.toLowerCase().indexOf(root.translationSearch.toLowerCase()) >= 0
                  width: settingsColumn.width
                  text: modelData.name + " (" + modelData.code + ")"
                  selected: root.setting("translation", "web") === modelData.code
                  bordered: true
                  foreground: root.foreground
                  onClicked: { root.translationSearch = ""; root.persist({ translation: modelData.code }) }
                }
              }
              Text {
                width: parent.width
                textFormat: Text.PlainText
                text: "Default: World English Bible (public domain). Verse text is fetched from bible-api.com and cached locally. Prime defaults to 07:00 so it does not collide with Morning Prayer at 06:00."
                color: root.muted
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                wrapMode: Text.WordWrap
              }
            }
          }
        }
      }
    }
  }
}

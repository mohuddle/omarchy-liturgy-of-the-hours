import QtQuick
import Quickshell
import qs.Commons
import qs.Ui
import "Model.js" as Model

// Two-column office card: hours on the left with the current hour in
// accent, today’s BSB Scripture on the right.
Panel {
  id: root
  moduleName: "io.github.mohuddle.liturgy-of-the-hours"
  ipcTarget: "io.github.mohuddle.liturgy-of-the-hours"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null
  property var service: null
  property bool showingSettings: false
  readonly property var barIdentity: hostWidget || root
  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color muted: Color.muted
  readonly property color accent: Color.accent
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family
  readonly property var schedule: service ? service.schedule : ({ hours: [], all: [], current: null, next: null, nowMinutes: 0 })
  readonly property var featured: service ? service.featured : null
  readonly property var listedHours: schedule.all && schedule.all.length ? schedule.all : Model.HOURS

  function open() {
    controller.show()
    if (service) {
      service.dismissHourNotifications()
      service.load()
    }
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
  }
  function hourTime(id, fallback) { return Model.parseHm(setting(id + "Time", fallback), fallback) }
  function hourEnabled(id) { return Model.boolSetting(setting(id + "Enabled", true), true) }
  function setHourTime(id, text) {
    persist((function() { var result = {}; result[id + "Time"] = Model.parseHm(text, hourTime(id, "06:00")); return result })())
  }
  function toggleHour(id) {
    persist((function() { var result = {}; result[id + "Enabled"] = !hourEnabled(id); return result })())
  }
  function isCurrentHour(hour) {
    return !!(schedule.current && hour && schedule.current.id === hour.id)
  }
  function hourColor(hour) {
    if (!hourEnabled(hour.id)) return muted
    if (isCurrentHour(hour)) return accent
    return foreground
  }
  function hourTimeLabel(hour) {
    return hour.time || hour.defaultTime || ""
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.barIdentity
    bar: root.bar
    open: root.opened
    centerOnBar: false
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(520))
    contentHeight: panel.fittedContentHeight(column.implicitHeight, Style.space(420))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }
      onTextKey: function(t) { if (t === "r" || t === "R") root.refresh() }

      Column {
        id: column
        width: parent.width
        spacing: Style.space(18)

        Item {
          width: parent.width
          height: headerRow.implicitHeight

          Row {
            id: headerRow
            anchors.left: parent.left
            anchors.right: gear.left
            anchors.rightMargin: Style.space(8)
            spacing: Style.space(16)

            JerusalemCross {
              id: cross
              size: Style.space(72)
              foreground: root.accent
              anchors.verticalCenter: parent.verticalCenter
            }

            Column {
              width: Math.max(0, headerRow.width - cross.width - headerRow.spacing)
              spacing: Style.space(4)
              anchors.verticalCenter: parent.verticalCenter

              Text {
                width: parent.width
                textFormat: Text.PlainText
                text: "Liturgy of the Hours"
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.title
                font.bold: true
                elide: Text.ElideRight
              }
              Text {
                width: parent.width
                textFormat: Text.PlainText
                text: root.showingSettings ? "Hour times and reminders" : (root.service && root.service.heroMeta ? root.service.heroMeta : "")
                color: root.accent
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                elide: Text.ElideRight
              }
            }
          }

          Button {
            id: gear
            anchors.right: parent.right
            anchors.top: parent.top
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

        Row {
          visible: !root.showingSettings
          width: parent.width
          spacing: Style.space(28)

          Column {
            id: hoursColumn
            width: Style.space(168)
            spacing: Style.space(10)

            Repeater {
              model: root.listedHours
              delegate: Row {
                required property var modelData
                width: hoursColumn.width
                spacing: Style.space(8)

                Text {
                  width: parent.width - timeLabel.implicitWidth - parent.spacing
                  textFormat: Text.PlainText
                  text: modelData.shortName
                  color: root.hourColor(modelData)
                  font.family: root.fontFamily
                  font.pixelSize: Style.font.body
                  font.bold: root.isCurrentHour(modelData)
                }
                Text {
                  id: timeLabel
                  textFormat: Text.PlainText
                  text: root.hourTimeLabel(modelData)
                  color: root.hourColor(modelData)
                  font.family: root.fontFamily
                  font.pixelSize: Style.font.body
                  font.bold: root.isCurrentHour(modelData)
                }
              }
            }
          }

          Column {
            width: Math.max(0, parent.width - hoursColumn.width - parent.spacing)
            spacing: Style.space(8)

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
                : (root.service && root.service.lastError !== "" ? root.service.lastError : "Today’s Scripture will appear here.")
              color: root.foreground
              font.family: root.fontFamily
              font.pixelSize: Style.font.body
              wrapMode: Text.WordWrap
            }
            Text {
              visible: root.service && root.service.verseText !== ""
              textFormat: Text.PlainText
              text: "BSB"
              color: root.muted
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
            }
          }
        }

        Column {
          id: settingsColumn
          visible: root.showingSettings
          width: parent.width
          spacing: Style.space(8)

          Button {
            width: parent.width
            text: root.setting("notificationsEnabled", true) ? "Hour reminders on" : "Hour reminders off"
            selected: root.setting("notificationsEnabled", true)
            bordered: true
            foreground: root.foreground
            onClicked: root.persist({ notificationsEnabled: !root.setting("notificationsEnabled", true) })
          }

          Repeater {
            model: Model.HOURS
            delegate: Row {
              required property var modelData
              width: settingsColumn.width
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

          Text {
            width: parent.width
            textFormat: Text.PlainText
            text: "Hour reminders stay on screen until you click the toast or the Jerusalem Cross. A church bell rings when they appear. Scripture is the Berean Standard Bible. Prime defaults to 07:00 so it does not collide with Morning Prayer at 06:00."
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

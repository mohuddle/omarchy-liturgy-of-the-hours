import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

// Compact Jerusalem Cross. Service.qml stays mounted with the bar so the
// little hours can fire even while the panel is closed. Click/IPC contract
// matches Canon; notify-on-right-click matches Bible Verse of the Day.
BarWidget {
  id: root
  moduleName: "io.github.mohuddle.liturgy-of-the-hours"

  Service {
    id: office
    settings: root.settings
  }

  readonly property color barForeground: bar ? bar.barForeground : Color.foreground
  readonly property color crossColor: office.hourIsNow ? Color.accent : (
    office.lastError !== "" && office.verseText === "" ? Qt.darker(barForeground, 1.2) : barForeground
  )

  readonly property bool opened: panelLoader.item ? panelLoader.item.opened === true : false
  readonly property bool popoutSwitchClosing: panelLoader.item ? panelLoader.item.popoutSwitchClosing === true : false

  function open() {
    office.dismissPluginNotifications()
    office.load()
    if (panelLoader.item) panelLoader.item.open()
  }

  function close() {
    if (panelLoader.item) panelLoader.item.close()
  }

  function togglePanel() {
    if (panelLoader.item) panelLoader.item.toggle()
  }

  function refresh() { office.load(true) }

  function openOffice() {
    office.prepareOffice()
    if (panelLoader.item && typeof panelLoader.item.showOffice === "function") {
      panelLoader.item.showOffice()
    } else {
      root.open()
    }
  }

  function closeForPopoutSwitch() {
    if (panelLoader.item) panelLoader.item.closeForPopoutSwitch()
  }

  function injectPanel() {
    var target = panelLoader.item
    if (!target) return
    if ("bar" in target) target.bar = root.bar
    if ("settings" in target) target.settings = root.settings
    if ("anchorItem" in target) target.anchorItem = button
    if ("hostWidget" in target) target.hostWidget = root
    if ("service" in target) target.service = office
  }

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  onBarChanged: injectPanel()
  onSettingsChanged: injectPanel()

  Loader {
    id: panelLoader
    active: true
    source: Qt.resolvedUrl("Panel.qml")
    visible: false
    onLoaded: {
      root.injectPanel()
      Qt.callLater(root.injectPanel)
    }
  }

  IpcHandler {
    target: "io.github.mohuddle.liturgy-of-the-hours"

    function open(): void { root.open() }
    function close(): void { root.close() }
    function show(): void { root.open() }
    function hide(): void { root.close() }
    function toggle(): void { root.togglePanel() }
    function refresh(): string { office.load(true); return "ok" }
    function status(): string { return office.statusText }
    function office(): void { root.openOffice() }
  }

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    tooltipText: office.tooltipText
    foreground: root.crossColor
    iconComponent: Component {
      JerusalemCross {
        anchors.fill: parent
        foreground: button.foreground
        size: Math.min(width, height)
      }
    }

    onPressed: function(b) {
      office.dismissPluginNotifications()
      if (b === Qt.MiddleButton) root.refresh()
      else if (b === Qt.RightButton) office.notifyVerse()
      else root.togglePanel()
    }
  }
}

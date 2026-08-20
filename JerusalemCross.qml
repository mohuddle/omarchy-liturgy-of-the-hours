import QtQuick

// Heraldic Jerusalem Cross: a large Greek cross with four smaller Greek
// crosses in the quadrants. Drawn so the bar can recolor it with the theme.
Item {
  id: root
  property color foreground: "#d4b15a"
  property real size: 16

  implicitWidth: size
  implicitHeight: size
  width: size
  height: size

  Canvas {
    id: canvas
    anchors.fill: parent
    antialiasing: true
    onPaint: {
      var ctx = getContext("2d")
      var s = Math.min(width, height)
      var x0 = (width - s) / 2
      var y0 = (height - s) / 2
      ctx.reset()
      ctx.fillStyle = root.foreground

      function greekCross(cx, cy, arm, thickness) {
        ctx.fillRect(cx - thickness / 2, cy - arm, thickness, arm * 2)
        ctx.fillRect(cx - arm, cy - thickness / 2, arm * 2, thickness)
      }

      greekCross(x0 + s * 0.5, y0 + s * 0.5, s * 0.46, s * 0.14)
      var offset = s * 0.255
      var smallArm = s * 0.09
      var smallT = s * 0.055
      greekCross(x0 + s * 0.5 - offset, y0 + s * 0.5 - offset, smallArm, smallT)
      greekCross(x0 + s * 0.5 + offset, y0 + s * 0.5 - offset, smallArm, smallT)
      greekCross(x0 + s * 0.5 - offset, y0 + s * 0.5 + offset, smallArm, smallT)
      greekCross(x0 + s * 0.5 + offset, y0 + s * 0.5 + offset, smallArm, smallT)
    }
  }

  onForegroundChanged: canvas.requestPaint()
  onWidthChanged: canvas.requestPaint()
  onHeightChanged: canvas.requestPaint()
  Component.onCompleted: canvas.requestPaint()
}

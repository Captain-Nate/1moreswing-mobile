// Generates the app icon + splash source art into assets/. The app icon mirrors the
// title screen's colour-toggle button (the glowing blue dot, upper-right): an 18px dot
// in a 38px rounded box with `box-shadow: 0 0 8px` of the accent. So the icon canvas =
// that box: button-coloured background (#161b22) + a centred dot at 18/38 ≈ 47% diameter
// + a soft glow, leaving the same dark margin around it. Run from repo root:
//   swift scripts/icongen.swift   &&   npm run assets
// Then build in Xcode. (npm run assets writes the per-machine ios/ icon set.)
import AppKit

func draw(px: Int, bg: (CGFloat, CGFloat, CGFloat), dotFrac: CGFloat, glowFrac: CGFloat,
          glowLayers: Int, path: String) {
  let size = CGFloat(px)
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px,
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let ctx = NSGraphicsContext.current!.cgContext

  ctx.setFillColor(NSColor(srgbRed: bg.0/255, green: bg.1/255, blue: bg.2/255, alpha: 1).cgColor)
  ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))

  let cx = size/2, cy = size/2, dotR = size*dotFrac
  let accent = NSColor(srgbRed: 0x58/255.0, green: 0xa6/255.0, blue: 0xff/255.0, alpha: 1)
  let dot = CGRect(x: cx-dotR, y: cy-dotR, width: dotR*2, height: dotR*2)

  ctx.setFillColor(accent.cgColor)
  for _ in 0..<glowLayers {                                   // soft same-colour glow (≈ box-shadow)
    ctx.setShadow(offset: .zero, blur: size*glowFrac, color: accent.cgColor)
    ctx.fillEllipse(in: dot)
  }
  ctx.setShadow(offset: .zero, blur: 0, color: nil)          // crisp dot on top
  ctx.setFillColor(accent.cgColor)
  ctx.fillEllipse(in: dot)

  NSGraphicsContext.restoreGraphicsState()
  let png = rep.representation(using: .png, properties: [:])!
  try? png.write(to: URL(fileURLWithPath: path)); print("wrote", path, px, "x", px)
}

// app icon = the colour button box: #161b22 bg, dot 18/38 ≈ 0.474 diameter (radius 0.237),
// glow 8/38 ≈ 0.21 of the box but kept subtle (1 layer) so the dark margin still reads
draw(px: 1024, bg: (22, 27, 34), dotFrac: 0.237, glowFrac: 0.055, glowLayers: 1, path: "assets/icon-only.png")
// splash = game background (#0d1117) with a small centred glowing dot
draw(px: 2732, bg: (13, 17, 23), dotFrac: 0.085, glowFrac: 0.03, glowLayers: 1, path: "assets/splash.png")
draw(px: 2732, bg: (13, 17, 23), dotFrac: 0.085, glowFrac: 0.03, glowLayers: 1, path: "assets/splash-dark.png")

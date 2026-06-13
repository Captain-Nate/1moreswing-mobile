// Generates the app icon + splash source art into assets/ — a glowing blue dot on
// the dark game background, matching the title screen's colour-toggle dot
// (an 18px circle with `box-shadow: 0 0 8px` of the accent colour). Run from repo root:
//   swift scripts/icongen.swift   &&   npm run assets
// Then build in Xcode. (npm run assets writes the per-machine ios/ icon set.)
import AppKit

// dotFrac = dot RADIUS as a fraction of canvas; glowFrac = glow blur radius as a fraction of canvas
func makeIcon(px: Int, dotFrac: CGFloat, glowFrac: CGFloat, path: String) {
  let size = CGFloat(px)
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px,
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let ctx = NSGraphicsContext.current!.cgContext

  // dark game background (#0d1117)
  ctx.setFillColor(NSColor(srgbRed: 0x0d/255.0, green: 0x11/255.0, blue: 0x17/255.0, alpha: 1).cgColor)
  ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))

  let cx = size/2, cy = size/2, dotR = size*dotFrac
  let accent = NSColor(srgbRed: 0x58/255.0, green: 0xa6/255.0, blue: 0xff/255.0, alpha: 1)
  let dot = CGRect(x: cx-dotR, y: cy-dotR, width: dotR*2, height: dotR*2)

  // soft glow (same colour) — fill the dot a few times with a blur shadow so the halo reads
  ctx.setFillColor(accent.cgColor)
  for _ in 0..<3 {
    ctx.setShadow(offset: .zero, blur: size*glowFrac, color: accent.cgColor)
    ctx.fillEllipse(in: dot)
  }
  // crisp solid dot on top (no shadow)
  ctx.setShadow(offset: .zero, blur: 0, color: nil)
  ctx.setFillColor(accent.cgColor)
  ctx.fillEllipse(in: dot)

  NSGraphicsContext.restoreGraphicsState()
  let png = rep.representation(using: .png, properties: [:])!
  try? png.write(to: URL(fileURLWithPath: path)); print("wrote", path, px, "x", px)
}

// icon: dot ~44% diameter (matches the UI dot's 18/42), soft glow
makeIcon(px: 1024, dotFrac: 0.22, glowFrac: 0.085, path: "assets/icon-only.png")
// splash: a smaller centred glowing dot
makeIcon(px: 2732, dotFrac: 0.085, glowFrac: 0.035, path: "assets/splash.png")
makeIcon(px: 2732, dotFrac: 0.085, glowFrac: 0.035, path: "assets/splash-dark.png")

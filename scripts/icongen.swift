// Generates the app icon + splash source art into assets/ (blue orb on the dark
// game background, matching the title screen's dot). Run from the repo root:
//   swift scripts/icongen.swift   &&   npm run assets
// Then build in Xcode. (npm run assets writes the per-machine ios/ icon set.)
import AppKit
func makeIcon(px: Int, dotFrac: CGFloat, glowFrac: CGFloat, path: String) {
  let size = CGFloat(px)
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px,
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let ctx = NSGraphicsContext.current!.cgContext
  ctx.setFillColor(NSColor(srgbRed: 0x0d/255.0, green: 0x11/255.0, blue: 0x17/255.0, alpha: 1).cgColor)
  ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
  let cx = size/2, cy = size/2, dotR = size*dotFrac, glowR = size*glowFrac
  let accent = NSColor(srgbRed: 0x58/255.0, green: 0xa6/255.0, blue: 0xff/255.0, alpha: 1)
  ctx.setFillColor(accent.withAlphaComponent(0.22).cgColor)
  ctx.fillEllipse(in: CGRect(x: cx-glowR, y: cy-glowR, width: glowR*2, height: glowR*2))
  ctx.setFillColor(accent.cgColor)
  ctx.fillEllipse(in: CGRect(x: cx-dotR, y: cy-dotR, width: dotR*2, height: dotR*2))
  NSGraphicsContext.restoreGraphicsState()
  let png = rep.representation(using: .png, properties: [:])!
  try? png.write(to: URL(fileURLWithPath: path)); print("wrote", path, px, "x", px)
}
makeIcon(px: 1024, dotFrac: 0.5*(21.0/32.0), glowFrac: 0.5*(30.0/32.0), path: "assets/icon-only.png")
makeIcon(px: 2732, dotFrac: 0.12, glowFrac: 0.18, path: "assets/splash.png")
makeIcon(px: 2732, dotFrac: 0.12, glowFrac: 0.18, path: "assets/splash-dark.png")

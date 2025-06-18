"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, RotateCcw } from "lucide-react"

// Utility functions
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b)
}

const simplifyRatio = (width: number, height: number): [number, number] => {
  // Find the number of decimal places in each input
  const widthDecimals = (width.toString().split(".")[1] || "").length;
  const heightDecimals = (height.toString().split(".")[1] || "").length;
  const factor = Math.pow(10, Math.max(widthDecimals, heightDecimals));
  const intWidth = Math.round(width * factor);
  const intHeight = Math.round(height * factor);
  const divisor = gcd(intWidth, intHeight);
  return [intWidth / divisor, intHeight / divisor];
}

// Color conversion utilities
const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
    : null
}

const hexToRgba = (hex: string): [number, number, number, number] | null => {
  if (hex.length === 9) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          Number.parseInt(result[1], 16),
          Number.parseInt(result[2], 16),
          Number.parseInt(result[3], 16),
          Number.parseInt(result[4], 16) / 255,
        ]
      : null
  }
  const rgb = hexToRgb(hex)
  return rgb ? [...rgb, 1] : null
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h /= 360
  s /= 100
  l /= 100

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  if (s === 0) {
    const val = Math.round(l * 255)
    return [val, val, val]
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = hue2rgb(p, q, h + 1 / 3)
  const g = hue2rgb(p, q, h)
  const b = hue2rgb(p, q, h - 1 / 3)

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// Simplified OKLCH conversion (basic implementation)
const rgbToOklch = (r: number, g: number, b: number): [number, number, number] => {
  // This is a simplified conversion - in production, you'd use a proper color space library
  const [h, s, l] = rgbToHsl(r, g, b)
  return [l / 100, s / 100, h]
}

const parseColor = (input: string): any => {
  const trimmed = input.trim().toLowerCase()

  // HEX
  if (trimmed.match(/^#([a-f0-9]{3}|[a-f0-9]{6}|[a-f0-9]{8})$/)) {
    let hex = trimmed
    if (hex.length === 4) {
      hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    }
    const rgba = hexToRgba(hex)
    if (rgba) {
      const [r, g, b, a] = rgba
      const [h, s, l] = rgbToHsl(r, g, b)
      const [ol, oc, oh] = rgbToOklch(r, g, b)
      return {
        hex: rgbToHex(r, g, b),
        hexa:
          rgbToHex(r, g, b) +
          Math.round(a * 255)
            .toString(16)
            .padStart(2, "0"),
        rgb: `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
        hsl: `hsl(${h}, ${s}%, ${l}%)`,
        hsla: `hsla(${h}, ${s}%, ${l}%, ${a})`,
        oklch: `oklch(${ol.toFixed(3)} ${oc.toFixed(3)} ${oh.toFixed(1)})`,
        preview: rgbToHex(r, g, b),
      }
    }
  }

  // RGB/RGBA
  const rgbMatch = trimmed.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?$$/)
  if (rgbMatch) {
    const r = Number.parseInt(rgbMatch[1])
    const g = Number.parseInt(rgbMatch[2])
    const b = Number.parseInt(rgbMatch[3])
    const a = rgbMatch[4] ? Number.parseFloat(rgbMatch[4]) : 1

    if (r <= 255 && g <= 255 && b <= 255 && a <= 1) {
      const [h, s, l] = rgbToHsl(r, g, b)
      const [ol, oc, oh] = rgbToOklch(r, g, b)
      return {
        hex: rgbToHex(r, g, b),
        hexa:
          rgbToHex(r, g, b) +
          Math.round(a * 255)
            .toString(16)
            .padStart(2, "0"),
        rgb: `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
        hsl: `hsl(${h}, ${s}%, ${l}%)`,
        hsla: `hsla(${h}, ${s}%, ${l}%, ${a})`,
        oklch: `oklch(${ol.toFixed(3)} ${oc.toFixed(3)} ${oh.toFixed(1)})`,
        preview: rgbToHex(r, g, b),
      }
    }
  }

  // HSL/HSLA
  const hslMatch = trimmed.match(/hsla?$$(\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?$$/)
  if (hslMatch) {
    const h = Number.parseInt(hslMatch[1])
    const s = Number.parseInt(hslMatch[2])
    const l = Number.parseInt(hslMatch[3])
    const a = hslMatch[4] ? Number.parseFloat(hslMatch[4]) : 1

    if (h <= 360 && s <= 100 && l <= 100 && a <= 1) {
      const [r, g, b] = hslToRgb(h, s, l)
      const [ol, oc, oh] = rgbToOklch(r, g, b)
      return {
        hex: rgbToHex(r, g, b),
        hexa:
          rgbToHex(r, g, b) +
          Math.round(a * 255)
            .toString(16)
            .padStart(2, "0"),
        rgb: `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
        hsl: `hsl(${h}, ${s}%, ${l}%)`,
        hsla: `hsla(${h}, ${s}%, ${l}%, ${a})`,
        oklch: `oklch(${ol.toFixed(3)} ${oc.toFixed(3)} ${oh.toFixed(1)})`,
        preview: rgbToHex(r, g, b),
      }
    }
  }

  return null
}

// Components
function PixelRemConverter() {
  const [pixels, setPixels] = useState("")
  const [rem, setRem] = useState("")
  const [baseFontSize, setBaseFontSize] = useState("16")
  const [error, setError] = useState("")

  const validateAndConvert = (value: string, isPixel: boolean) => {
    setError("")

    if (!value) {
      setPixels("")
      setRem("")
      return
    }

    const num = Number.parseFloat(value)
    const base = Number.parseFloat(baseFontSize)

    if (isNaN(num) || num < 0) {
      setError("Please enter a valid positive number")
      return
    }

    if (isNaN(base) || base <= 0) {
      setError("Base font size must be a positive number")
      return
    }

    if (isPixel) {
      setPixels(value)
      setRem((num / base).toFixed(4))
    } else {
      setRem(value)
      setPixels((num * base).toFixed(2))
    }
  }

  const reset = () => {
    setPixels("")
    setRem("")
    setBaseFontSize("16")
    setError("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Pixel ↔ Rem Converter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="pixels">Pixels (px)</Label>
            <Input
              id="pixels"
              type="number"
              placeholder="Enter pixels"
              value={pixels}
              onChange={(e) => validateAndConvert(e.target.value, true)}
            />
          </div>
          <div>
            <Label htmlFor="rem">Rem</Label>
            <Input
              id="rem"
              type="number"
              placeholder="Enter rem"
              value={rem}
              onChange={(e) => validateAndConvert(e.target.value, false)}
            />
          </div>
          <div>
            <Label htmlFor="baseFontSize">Base Font Size (px)</Label>
            <Input
              id="baseFontSize"
              type="number"
              placeholder="16"
              value={baseFontSize}
              onChange={(e) => {
                setBaseFontSize(e.target.value)
                if (pixels) validateAndConvert(pixels, true)
                if (rem) validateAndConvert(rem, false)
              }}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button onClick={reset} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </CardContent>
    </Card>
  )
}

function AspectRatioCalculator() {
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [ratio, setRatio] = useState("")
  const [decimal, setDecimal] = useState("")
  const [error, setError] = useState("")

  const calculateRatio = (w: string, h: string) => {
    setError("")

    if (!w || !h) {
      setRatio("")
      setDecimal("")
      return
    }

    const widthNum = Number.parseFloat(w)
    const heightNum = Number.parseFloat(h)

    if (isNaN(widthNum) || isNaN(heightNum) || widthNum <= 0 || heightNum <= 0) {
      setError("Please enter valid positive numbers")
      setRatio("")
      setDecimal("")
      return
    }

    const [simplifiedWidth, simplifiedHeight] = simplifyRatio(widthNum, heightNum)
    setRatio(`${simplifiedWidth}:${simplifiedHeight}`)
    setDecimal((widthNum / heightNum).toFixed(3))
  }

  const reset = () => {
    setWidth("")
    setHeight("")
    setRatio("")
    setDecimal("")
    setError("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aspect Ratio Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              placeholder="Enter width"
              value={width}
              onChange={(e) => {
                setWidth(e.target.value)
                calculateRatio(e.target.value, height)
              }}
            />
          </div>
          <div>
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              placeholder="Enter height"
              value={height}
              onChange={(e) => {
                setHeight(e.target.value)
                calculateRatio(width, e.target.value)
              }}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {ratio && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-lg font-semibold">Aspect Ratio: {ratio}</div>
            <div className="text-sm text-muted-foreground">Decimal: {decimal}</div>
          </div>
        )}

        <Button onClick={reset} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </CardContent>
    </Card>
  )
}

function ColorConverter() {
  const [input, setInput] = useState("")
  const [colors, setColors] = useState<any>(null)
  const [error, setError] = useState("")

  const convertColor = (value: string) => {
    setError("")

    if (!value.trim()) {
      setColors(null)
      return
    }

    const result = parseColor(value)
    if (result) {
      setColors(result)
    } else {
      setError("Invalid color format. Supported formats: HEX, RGB, RGBA, HSL, HSLA, OKLCH")
      setColors(null)
    }
  }

  const reset = () => {
    setInput("")
    setColors(null)
    setError("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Format Converter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="colorInput">Color Input</Label>
          <Input
            id="colorInput"
            placeholder="Enter color (e.g., #FF0000, rgb(255,0,0), hsl(0,100%,50%))"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              convertColor(e.target.value)
            }}
          />
          <div className="text-xs text-muted-foreground mt-1">Supports: HEX, RGB, RGBA, HSL, HSLA, OKLCH, HEXA</div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {colors && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg border-2 border-border"
                style={{ backgroundColor: colors.preview }}
              />
              <div className="text-sm text-muted-foreground">Color Preview</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">HEX</div>
                <div className="font-mono text-sm">{colors.hex}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">HEXA</div>
                <div className="font-mono text-sm">{colors.hexa}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">RGB</div>
                <div className="font-mono text-sm">{colors.rgb}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">RGBA</div>
                <div className="font-mono text-sm">{colors.rgba}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">HSL</div>
                <div className="font-mono text-sm">{colors.hsl}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">HSLA</div>
                <div className="font-mono text-sm">{colors.hsla}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg md:col-span-2">
                <div className="font-medium text-sm">OKLCH</div>
                <div className="font-mono text-sm">{colors.oklch}</div>
              </div>
            </div>
          </div>
        )}

        <Button onClick={reset} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ConversionTools() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Developer Conversion Tools</h1>
          <p className="text-muted-foreground">
            Essential conversion utilities for web developers - pixels, ratios, and colors
          </p>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          <PixelRemConverter />
          <AspectRatioCalculator />
          <ColorConverter />
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="font-semibold">How to Use:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
              <div>
                <strong>Pixel/Rem Converter:</strong> Enter a value in either field for instant conversion. Customize
                the base font size (default: 16px).
              </div>
              <div>
                <strong>Aspect Ratio:</strong> Enter width and height to get the simplified ratio (e.g., 1920×1080 =
                16:9).
              </div>
              <div>
                <strong>Color Converter:</strong> Enter any color format to see all equivalent formats with a live
                preview.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

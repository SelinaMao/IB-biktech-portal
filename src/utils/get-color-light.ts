/**
 * Adjusts the lightness of a 6-digit hex color by a specified percentage.
 * 
 * @param hex - The hex color code (e.g., "#2D9CDB" or "2D9CDB")
 * @param lightnessPercent - Target lightness percentage (0 to 100)
 * @returns The resulting 6-digit hex color string in uppercase
 */
export function adjustLightness(hex: string, lightnessPercent: number): string {
    if (!hex || !/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex)) {
        return "#FFFFFF"; // Or return a default fallback string
    }

    // 1. Clean and parse hex string
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    // 2. Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const delta = max - min;

    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;

        const lTemp = (max + min) / 2;
        s = delta / (1 - Math.abs(2 * lTemp - 1));
    }

    // 3. Set the requested lightness (clamped between 0 and 100)
    const l = Math.min(100, Math.max(0, lightnessPercent)) / 100;

    // 4. Convert back from HSL to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let rNew = 0, gNew = 0, bNew = 0;

    if (0 <= h && h < 60) { rNew = c; gNew = x; bNew = 0; }
    else if (60 <= h && h < 120) { rNew = x; gNew = c; bNew = 0; }
    else if (120 <= h && h < 180) { rNew = 0; gNew = c; bNew = x; }
    else if (180 <= h && h < 240) { rNew = 0; gNew = x; bNew = c; }
    else if (240 <= h && h < 300) { rNew = x; gNew = 0; bNew = c; }
    else if (300 <= h && h < 360) { rNew = c; gNew = 0; bNew = x; }

    const toHex = (n: number) => {
        const hexVal = Math.round((n + m) * 255).toString(16);
        return hexVal.length === 1 ? '0' + hexVal : hexVal;
    };

    return `#${toHex(rNew)}${toHex(gNew)}${toHex(bNew)}`.toUpperCase();
}

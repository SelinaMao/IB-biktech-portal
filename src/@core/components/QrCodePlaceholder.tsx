"use client";

import Box from "@mui/material/Box";

const GRID = 21; // classic QR "Version 1" module count, purely visual
const FINDER_SIZE = 7;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function finderCorner(row: number, col: number): [number, number] | null {
  const corners: [number, number][] = [
    [0, 0],
    [0, GRID - FINDER_SIZE],
    [GRID - FINDER_SIZE, 0],
  ];
  return (
    corners.find(
      ([r, c]) => row >= r && row < r + FINDER_SIZE && col >= c && col < c + FINDER_SIZE,
    ) ?? null
  );
}

function isFinderModuleOn(row: number, col: number, originRow: number, originCol: number) {
  const r = row - originRow;
  const c = col - originCol;
  const isOuterRing = r === 0 || r === FINDER_SIZE - 1 || c === 0 || c === FINDER_SIZE - 1;
  const isInnerBlock = r >= 2 && r <= 4 && c >= 2 && c <= 4;
  return isOuterRing || isInnerBlock;
}

export type QrCodePlaceholderProps = {
  /** Seeds the pseudo-random module pattern — same value always renders the same code. */
  value: string;
  size?: number;
};

/**
 * Deterministic, dependency-free QR-look pattern for demo/mock approval
 * flows — reads visually as a QR code but isn't decodable (there's no
 * pairing backend to scan against).
 */
export default function QrCodePlaceholder({ value, size = 180 }: QrCodePlaceholderProps) {
  const random = seededRandom(hashString(value) || 1);
  const cell = size / GRID;

  const modules: boolean[][] = Array.from({ length: GRID }, (_, row) =>
    Array.from({ length: GRID }, (_, col) => {
      const corner = finderCorner(row, col);
      if (corner) return isFinderModuleOn(row, col, corner[0], corner[1]);
      return random() > 0.55;
    }),
  );

  return (
    <Box sx={{ width: size, height: size, bgcolor: "#FFFFFF" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR code">
        <rect width={size} height={size} fill="#FFFFFF" />
        {modules.map((rowModules, row) =>
          rowModules.map((on, col) =>
            on ? (
              <rect
                key={`${row}-${col}`}
                x={col * cell}
                y={row * cell}
                width={cell}
                height={cell}
                fill="#0a0a0a"
              />
            ) : null,
          ),
        )}
      </svg>
    </Box>
  );
}

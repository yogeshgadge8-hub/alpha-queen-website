const CODE_128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
] as const;

type BarcodeProps = {
  value: string;
  className?: string;
};

function encodeCode128B(value: string) {
  const safeValue = value
    .toUpperCase()
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join("");
  const data = safeValue.split("").map((character) => character.charCodeAt(0) - 32);
  const checksum = (104 + data.reduce((sum, code, index) => sum + code * (index + 1), 0)) % 103;
  return { safeValue, codes: [104, ...data, checksum, 106] };
}

export function Code128Barcode({ value, className = "" }: BarcodeProps) {
  const { safeValue, codes } = encodeCode128B(value);
  const quietZone = 10;
  const barHeight = 34;
  const textHeight = 13;
  const bars: Array<{ x: number; width: number }> = [];
  let cursor = quietZone;

  codes.forEach((code) => {
    CODE_128_PATTERNS[code].split("").forEach((moduleWidth, index) => {
      const width = Number(moduleWidth);
      if (index % 2 === 0) bars.push({ x: cursor, width });
      cursor += width;
    });
  });

  const totalWidth = cursor + quietZone;

  return (
    <svg
      className={`code128-barcode ${className}`.trim()}
      viewBox={`0 0 ${totalWidth} ${barHeight + textHeight}`}
      role="img"
      aria-label={`Order barcode ${safeValue}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width={totalWidth} height={barHeight + textHeight} fill="#fff" />
      <g fill="#000" shapeRendering="crispEdges">
        {bars.map((bar, index) => <rect key={`${bar.x}-${index}`} x={bar.x} y="0" width={bar.width} height={barHeight} />)}
      </g>
      <text x={totalWidth / 2} y={barHeight + 10} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" letterSpacing="1">{safeValue}</text>
    </svg>
  );
}

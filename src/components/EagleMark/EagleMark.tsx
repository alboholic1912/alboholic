/**
 * The right half of the double-headed eagle on a 200 x 200 grid; the left is its mirror image.
 * The same outline is drawn onto the flag in the hero art: see scripts/home-art/render.mjs.
 */
const HALF =
  "M100 62C101 49 104 38 110 29C113 23 119 19 126 20L138 24L153 29L143 32.5L150 40L136 37.5C130 40 125 46 122 54L121 60L133 57L150 46L168 38L191 21L171 47L198 41L168 57L199 60L163 66L194 79L157 74L183 95L149 82L167 107L140 88L146 109L130 93L118 99L114 112L123 121L137 134L153 132L141 139L151 151L137 144L136 159L129 144L116 131L110 129L110 139L127 153L113 151L122 169L109 163L112 183L104 173L100 193Z";

/** The eagle of the Albanian flag as a one-colour mark. It takes the text colour. */
export default function EagleMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 6 200 200"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={HALF} />
      <path d={HALF} transform="translate(200 0) scale(-1 1)" />
    </svg>
  );
}

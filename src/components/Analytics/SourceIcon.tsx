/** Small one-colour marks for the places visitors come from. Anything unknown gets a globe. */
export default function SourceIcon({ name }: { name: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

  switch (name) {
    case "Instagram":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...stroke} />
          <circle cx="12" cy="12" r="4" {...stroke} />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      );
    case "Facebook":
      return (
        <svg {...common}>
          <path d="M14.5 8H17V4.5h-2.5A4 4 0 0 0 10.5 8.5V11H8v3.5h2.5V21H14v-6.5h2.6l.5-3.5H14V9a1 1 0 0 1 1-1Z" {...stroke} />
        </svg>
      );
    case "Google":
    case "Bing":
    case "DuckDuckGo":
    case "Yahoo":
    case "Yandex":
    case "Ecosia":
    case "Brave Search":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6" {...stroke} />
          <path d="m15 15 5 5" {...stroke} />
        </svg>
      );
    case "Direct":
      return (
        <svg {...common}>
          <path d="M5 12h13M13 6l6 6-6 6" {...stroke} />
        </svg>
      );
    case "Internal":
      return (
        <svg {...common}>
          <path d="M4 7h11M11 3l4 4-4 4M20 17H9M13 13l-4 4 4 4" {...stroke} />
        </svg>
      );
    case "X (Twitter)":
      return (
        <svg {...common}>
          <path d="M5 4l14 16M19 4 5 20" {...stroke} />
        </svg>
      );
    case "WhatsApp":
    case "Telegram":
      return (
        <svg {...common}>
          <path d="M4.5 19.5 6 15.6A8 8 0 1 1 9 18.6l-4.5.9Z" {...stroke} />
        </svg>
      );
    case "TikTok":
    case "YouTube":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="4" {...stroke} />
          <path d="m10.5 9.5 4 2.5-4 2.5v-5Z" fill="currentColor" />
        </svg>
      );
    case "Newsletter":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" {...stroke} />
          <path d="m4 7 8 6 8-6" {...stroke} />
        </svg>
      );
    case "ChatGPT":
    case "Claude":
    case "Perplexity":
      return (
        <svg {...common}>
          <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18" {...stroke} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" {...stroke} />
          <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z" {...stroke} />
        </svg>
      );
  }
}

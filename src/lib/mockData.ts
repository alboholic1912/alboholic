export type Story = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  imageTone: "crimson" | "amber" | "stone" | "slate";
  aiImage: boolean;
  credit?: string;
  body?: string[];
  /** Path under /public to a real image, e.g. "/images/stories/my-slug.jpg". Falls back to the gradient imageTone when unset. */
  image?: string;
};

export const featuredStories: Story[] = [
  {
    slug: "skenderbeu-and-the-making-of-a-nation",
    category: "Featured Story",
    title: "Skenderbeu and the Making of a Nation",
    excerpt:
      "How a 15th century resistance leader became a lasting symbol of Albanian identity — and why his legacy still matters today.",
    date: "Sep 12, 2026",
    readTime: "8 min read",
    imageTone: "crimson",
    aiImage: true,
    credit: "Krujë Castle, Albania — AI-generated illustration",
    body: [
      "In 1443, a former Ottoman officer named Gjergj Kastrioti slipped away from a battlefield in Niš and rode for Krujë, the mountain town of his birth. Within weeks he had reclaimed his father's castle, raised the red-and-black double-headed eagle, and renounced the faith and army that had raised him. History would remember him as Skenderbeu.",
      "For the next twenty-five years, Skenderbeu held together a fractious coalition of Albanian lords under the League of Lezhë, using the terrain of the northern highlands to repel Ottoman army after Ottoman army. His victories at Torvioll, Otonetë and the long sieges of Krujë made him a celebrity across Christian Europe, courted by popes and princes who saw in him a bulwark against Ottoman expansion.",
      "He never saw the empire he resisted destroyed, and Ottoman rule arrived in Albania a decade after his death in 1468. But the memory of a small mountain people who held off the region's dominant power for a generation became something more durable than the battles themselves — a founding story that resurfaced in the National Awakening of the 1800s and still anchors Albanian national identity today.",
    ],
  },
  {
    slug: "illyrians-the-forgotten-empire-of-the-balkans",
    category: "Featured Story",
    title: "Illyrians: The Forgotten Empire of the Balkans",
    excerpt:
      "Long before Rome and Byzantium carved up the region, the Illyrian tribes built a world of their own across the western Balkans.",
    date: "Sep 5, 2026",
    readTime: "12 min read",
    imageTone: "stone",
    aiImage: true,
    credit: "Butrint, Albania — AI-generated illustration",
    body: [
      "For nearly a thousand years before Roman legions crossed the Adriatic, a patchwork of tribes speaking related Indo-European languages controlled the western Balkans, from the Danube basin to the Ionian coast. Historians group them under the name Illyrians, though they were never a single nation — more a shifting web of kingdoms, tribal confederations and hillfort settlements bound by trade, war and intermarriage.",
      "The best-documented of these was the Ardiaei kingdom, which by the 3rd century BCE controlled the Adriatic coast under rulers like Agron and, after his death, his widow Queen Teuta — whose clashes with Roman shipping triggered the Illyrian Wars and drew Rome permanently into Balkan affairs.",
      "Illyrian resistance did not end quickly. It took Rome more than two centuries and a final, brutal war under Emperor Augustus to fully absorb the region. Even after annexation, Illyrian soldiers, senators and eventually emperors — including Diocletian and Constantine the Great — rose to the top of Roman power, a legacy usually overshadowed by Rome's own telling of the story.",
    ],
  },
];

export const latestStories: Story[] = [
  {
    slug: "living-traditions-of-northern-albania",
    category: "Culture",
    title: "The Living Traditions of Northern Albania",
    excerpt:
      "From the Kanun to kulla towers, the customs that still shape life in the highlands.",
    date: "Sep 12, 2026",
    readTime: "8 min read",
    imageTone: "amber",
    aiImage: true,
    body: [
      "In the highlands of Shkodër, Tropojë and Dukagjin, a body of customary law known as the Kanun of Lekë Dukagjini still shapes how families understand hospitality, honor and obligation, centuries after it was first codified. Passed down orally long before it was written in the 15th century, the Kanun governed everything from land inheritance to blood feuds in areas where state authority rarely reached.",
      "The physical landscape carries its own record of this history. Fortified stone towers called kulla, built with narrow slit windows and thick walls, still stand across the north — built as much for defense as for daily life, a reminder of how central self-reliance was to highland communities.",
      "Much of this culture persisted through isolation rather than in spite of it, surviving Ottoman administration, monarchy and decades of communist suppression of religious and customary practice. Today, kulla towers have found new life as guesthouses, and the Kanun is studied as much for its legal sophistication as its historical color.",
    ],
  },
  {
    slug: "the-1990-student-protests-in-tirana",
    category: "Modern History",
    title: "The 1990 Student Protests in Tirana",
    excerpt:
      "The dormitory demonstrations that helped bring down decades of isolation.",
    date: "Sep 8, 2026",
    readTime: "10 min read",
    imageTone: "slate",
    aiImage: false,
    body: [
      "On the night of December 8, 1990, students at Tirana's Enver Hoxha University dormitory complex lit candles, chanted for democratic reform, and refused to disperse — the first open, sustained challenge to Albania's communist government in over four decades of one-party rule.",
      "What began as a protest over living conditions quickly widened into demands for pluralism, freedom of movement and an end to the regime built by Enver Hoxha. Within days the demonstrations had spread beyond the dormitories to the wider city, drawing in workers and ordinary residents.",
      "The government of Ramiz Alia, wary of the upheavals already sweeping Eastern Europe, made concessions rather than risk a violent crackdown, legalizing opposition parties within weeks. The Democratic Party was founded that same December, and by 1992 Albania had held its first genuinely competitive elections — closing the book on the most isolated state in Cold War Europe.",
    ],
  },
];

export function getAllStories(): Story[] {
  const seen = new Set<string>();
  const all: Story[] = [];
  for (const story of [...featuredStories, ...latestStories]) {
    if (seen.has(story.slug)) continue;
    seen.add(story.slug);
    all.push(story);
  }
  return all;
}

export function getStoryBySlug(slug: string): Story | undefined {
  return getAllStories().find((story) => story.slug === slug);
}

export type Person = {
  slug: string;
  name: string;
  role: string;
  era: string;
  imageTone: "crimson" | "amber" | "stone" | "slate";
  bio?: string;
  image?: string;
};

export const people: Person[] = [
  {
    slug: "gjergj-kastrioti-skenderbeu",
    name: "Gjergj Kastrioti Skenderbeu",
    role: "Military Leader",
    era: "1405 – 1468",
    imageTone: "crimson",
    bio: "Led a 25-year Albanian resistance against Ottoman expansion, becoming the country's most enduring national symbol.",
  },
  {
    slug: "ismail-qemali",
    name: "Ismail Qemali",
    role: "Statesman",
    era: "1844 – 1919",
    imageTone: "amber",
    bio: "Declared Albanian independence in Vlorë on November 28, 1912, and served as the first head of the provisional government.",
  },
  {
    slug: "mother-teresa",
    name: "Mother Teresa",
    role: "Humanitarian",
    era: "1910 – 1997",
    imageTone: "stone",
    bio: "Born in Skopje to an Albanian family, she founded the Missionaries of Charity and was awarded the Nobel Peace Prize in 1979.",
  },
  {
    slug: "edith-durham",
    name: "Edith Durham",
    role: "Writer & Traveller",
    era: "1863 – 1944",
    imageTone: "slate",
    bio: "A British writer whose travels and writing on the Balkans in the early 20th century made her a well-known advocate for Albania abroad.",
  },
];

export function getPersonBySlug(slug: string): Person | undefined {
  return people.find((person) => person.slug === slug);
}

export type Period = {
  slug: string;
  name: string;
  range: string;
  description: string;
};

export const periods: Period[] = [
  { slug: "illyrians", name: "Illyrians", range: "1200 BCE – 168 BCE", description: "The tribes and kingdoms of the ancient western Balkans." },
  { slug: "skenderbeg-era", name: "Skanderbeg Era", range: "1405 – 1468", description: "Resistance against Ottoman expansion under Gjergj Kastrioti." },
  { slug: "ottoman-period", name: "Ottoman Period", range: "1479 – 1912", description: "Four centuries under Ottoman rule and the rise of the National Awakening." },
  { slug: "independence", name: "Independence", range: "1912 – 1944", description: "The declaration of independence and the interwar kingdom." },
  { slug: "communist-era", name: "Communist Era", range: "1944 – 1991", description: "Isolation, industrialization and life under one-party rule." },
  { slug: "modern-albania", name: "Modern Albania", range: "1991 – Present", description: "Transition, migration and the country's path since the fall of communism." },
];

export function getPeriodBySlug(slug: string): Period | undefined {
  return periods.find((period) => period.slug === slug);
}

export type Place = {
  slug: string;
  name: string;
  region: string;
  description: string;
  imageTone: "crimson" | "amber" | "stone" | "slate";
  image?: string;
};

export const places: Place[] = [
  {
    slug: "kruje-castle",
    name: "Krujë Castle",
    region: "Krujë",
    description: "The hilltop fortress from which Skenderbeu led Albanian resistance against Ottoman sieges.",
    imageTone: "crimson",
  },
  {
    slug: "butrint",
    name: "Butrint",
    region: "Vlorë County",
    description: "A UNESCO World Heritage archaeological site layered with Greek, Roman, Byzantine and Venetian ruins.",
    imageTone: "stone",
  },
  {
    slug: "berat",
    name: "Berat",
    region: "Berat County",
    description: "The 'City of a Thousand Windows,' known for its Ottoman-era hillside houses stacked above the Osum river.",
    imageTone: "amber",
  },
  {
    slug: "gjirokaster",
    name: "Gjirokastër",
    region: "Gjirokastër County",
    description: "A stone city of Ottoman architecture in the south, and the birthplace of writer Ismail Kadare.",
    imageTone: "slate",
  },
];

export function getPlaceBySlug(slug: string): Place | undefined {
  return places.find((place) => place.slug === slug);
}

export interface Scripture {
  id: string;
  text: string;
  reference: string;
  theme: string;
  reflection: string;
}

export const themes = [
  "Leadership",
  "Courage",
  "Faith",
  "Patience",
  "Discipline",
  "Purpose",
  "Wisdom",
  "Perseverance",
] as const;

export type Theme = (typeof themes)[number];

export const scriptures: Scripture[] = [
  {
    id: "1",
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9",
    theme: "Courage",
    reflection: "As a founder, you will face moments of deep uncertainty. This verse reminds us that courage isn't the absence of fear — it's moving forward knowing you are never alone in the journey.",
  },
  {
    id: "2",
    text: "Commit to the Lord whatever you do, and he will establish your plans.",
    reference: "Proverbs 16:3",
    theme: "Purpose",
    reflection: "Your vision is powerful, but surrendering it to a higher purpose transforms ambition into calling. Let your plans be guided by something greater than profit alone.",
  },
  {
    id: "3",
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11",
    theme: "Faith",
    reflection: "When the path ahead seems unclear and setbacks mount, hold onto this truth: there is a divine blueprint for your life that no obstacle can derail.",
  },
  {
    id: "4",
    text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    reference: "Galatians 6:9",
    theme: "Perseverance",
    reflection: "Building anything meaningful requires endurance. The harvest doesn't come overnight — it comes to those who persist through seasons of planting and waiting.",
  },
  {
    id: "5",
    text: "Where there is no vision, the people perish.",
    reference: "Proverbs 29:18",
    theme: "Leadership",
    reflection: "As a leader, your vision gives your team direction and hope. Without it, even the most talented people lose their way. Cast vision boldly and often.",
  },
  {
    id: "6",
    text: "No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace for those who have been trained by it.",
    reference: "Hebrews 12:11",
    theme: "Discipline",
    reflection: "The daily grind of disciplined work may feel thankless, but every difficult season is training you for the impact you're called to make.",
  },
  {
    id: "7",
    text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",
    reference: "James 1:5",
    theme: "Wisdom",
    reflection: "You don't need to have all the answers. The wisest founders know when to pause, reflect, and seek guidance beyond their own understanding.",
  },
  {
    id: "8",
    text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.",
    reference: "Isaiah 40:31",
    theme: "Patience",
    reflection: "In a world obsessed with speed, patience is a radical act of faith. The strength you need will come — not from striving harder, but from trusting deeper.",
  },
  {
    id: "9",
    text: "Iron sharpens iron, and one man sharpens another.",
    reference: "Proverbs 27:17",
    theme: "Leadership",
    reflection: "You were not meant to build alone. Surround yourself with people who challenge and refine you. The strongest leaders are forged in community.",
  },
  {
    id: "10",
    text: "I can do all things through Christ who strengthens me.",
    reference: "Philippians 4:13",
    theme: "Faith",
    reflection: "This is not a promise of ease — it's a promise of sufficiency. Whatever your challenge today, you have access to a strength that transcends your own capacity.",
  },
  {
    id: "11",
    text: "The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.",
    reference: "Proverbs 21:5",
    theme: "Discipline",
    reflection: "Hustle without strategy leads to burnout. True abundance comes from thoughtful, consistent effort directed by wisdom and patience.",
  },
  {
    id: "12",
    text: "Be strong and let your heart take courage, all you who wait for the Lord!",
    reference: "Psalm 31:24",
    theme: "Courage",
    reflection: "Waiting is not passive — it takes immense courage. Whether you're waiting for funding, traction, or breakthrough, let your heart be strong in the waiting.",
  },
];

export function getDailyScripture(): Scripture {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return scriptures[dayOfYear % scriptures.length];
}

export function getScripturesByTheme(theme: string): Scripture[] {
  return scriptures.filter((s) => s.theme === theme);
}

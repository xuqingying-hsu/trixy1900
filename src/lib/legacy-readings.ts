export type LegacyReading = {
  slug: string;
  title: string;
  imageSrc: string;
  width: number;
  height: number;
};

export const legacyReadings: LegacyReading[] = [
  {
    slug: "next-romance",
    title: "你的下一个桃花是一个怎么样的人",
    imageSrc: "/legacy-readings/next-romance.jpg",
    width: 1280,
    height: 5431
  },
  {
    slug: "group-help",
    title: "这个群能够给你带来什么帮助",
    imageSrc: "/legacy-readings/group-help.jpg",
    width: 1280,
    height: 5431
  },
  {
    slug: "parent-communication",
    title: "和父母用什么方式沟通会更好",
    imageSrc: "/legacy-readings/parent-communication.jpg",
    width: 1280,
    height: 5431
  },
  {
    slug: "jealous-around-you",
    title: "你身边有人正在嫉妒你吗",
    imageSrc: "/legacy-readings/jealous-around-you.jpg",
    width: 1280,
    height: 5431
  }
];

export function getLegacyReading(slug: string) {
  return legacyReadings.find((reading) => reading.slug === slug) ?? null;
}

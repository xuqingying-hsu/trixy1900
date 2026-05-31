export type LegacyReadingOption = {
  optionKey: "A" | "B" | "C";
  title: string;
  imageSrc: string;
  text: string;
};

export type LegacyReading = {
  slug: string;
  title: string;
  imageSrc: string;
  width: number;
  height: number;
  options: LegacyReadingOption[];
};

export const legacyReadings: LegacyReading[] = [
  {
    slug: "next-romance",
    title: "你的下一个桃花是一个怎么样的人",
    imageSrc: "/legacy-readings/next-romance.jpg",
    width: 1280,
    height: 5431,
    options: [
      {
        optionKey: "A",
        title: "第一组",
        imageSrc: "/legacy-readings/options/next-romance-A.jpg",
        text: "选第一组的，你的下个桃花首先是个男人，能量磁场很差，是个烂桃花。你大概率会给他花很多钱，但是就算你给他花很多钱，他也转身就走了。他最后还是会离开你，花钱也留不住他，完全烂桃花，而且这个男的，他自己的能量磁场比较差，他也可能存在这个三方关系。他不止有你一个女性桃花，他也比较看重利益，也比较色情啊，就是利益到手了，说走就走。"
      },
      {
        optionKey: "B",
        title: "第二组",
        imageSrc: "/legacy-readings/options/next-romance-B.jpg",
        text: "第二组的下一个桃花呢，整体应该是年纪比你大，属于年上。然后自己应该也是有收入的，挺有钱的，但是情绪不是很稳定，有点儿阴晴不定吧。而且他自己肯定是有一点儿秘密瞒着你的，不过他这个人呢很有学识、知识面丰富，是年上男那种传统大男子主义，你会觉得他挺聪明，挺有文化，挺有智慧，然后又挺有钱，又挺有行动力这样子。但是很难去评判是一个好桃花，还是一个烂桃花，反正我觉得见仁见智吧，就是总体来说，这个男的好像还不错。"
      },
      {
        optionKey: "C",
        title: "第三组",
        imageSrc: "/legacy-readings/options/next-romance-C.jpg",
        text: "第三组的下一个桃花好不好说，是不是孽缘，反正你是真的挺喜欢，就你俩应该是互相挺喜欢对方的。就是宿命纠缠，有种命中注定的感觉，但是也可能会存在一些背叛啊，隐瞒或者说 PUA 什么的，且有很大概率是网恋。然后呢，他也算是一个好朋友吧，就是能够提供给你一些陪伴啊，忠诚啊，你能够跟他有一些这种深度的交流啊这种，反正就是命运的纠缠吧。情劫到了，缘分到了，是不是正缘你自己去修吧，喜欢是真的很喜欢，然后说不上是好人，也说不上是坏人，反正就是一体两面都有。"
      }
    ]
  },
  {
    slug: "group-help",
    title: "这个群能够给你带来什么帮助",
    imageSrc: "/legacy-readings/group-help.jpg",
    width: 1280,
    height: 5431,
    options: [
      {
        optionKey: "A",
        title: "第一组",
        imageSrc: "/legacy-readings/options/group-help-A.jpg",
        text: "能够给你带来的贡献其实还挺多的，能够给你带来一定的安全感，帮你解决一些问题，给到一些力量，帮你解决一些问题，能够给你带来内心的平静，包括怎么去处理一些关系，比如感情关系、人际关系，怎么去应对一些小人的纠缠，负面能量，诸如此类的。最重要的就是安全感和底气。我觉得这个群对于选第一组的朋友们来说，就是回家了，这是我的一个家，这是我的一个避风的港湾，我在外面不管怎么看着了，我回到这里我就可以休息，挺好的。"
      },
      {
        optionKey: "B",
        title: "第二组",
        imageSrc: "/legacy-readings/options/group-help-B.jpg",
        text: "能够带来一些小的比较随机的小变化吧，带来一些人际关系上的社交方面的一些东西，然后可能第 2 组会有恋爱脑，我觉得最重要的帮助是能够教会你离开，或者说给到你离开的勇气，当断则断的勇气，跟烂人烂事说再见的勇气。可能能够带给你一些社交的帮助，然后还有一些清理负面能量啊相关的。就是一些幸运的随机的，我不知道怎么说，就是你自己都不确定，可能你本来对于你来说，你自己没有这方面的想法，就比如说你自己没有什么谈恋爱的想法，但是可能我发了一个，你的下一任的对象啊，或者你的下一个桃花啊，然后你也看了。这个东西对你来说就是一个随机掉落的礼物吧，就这种感觉。"
      },
      {
        optionKey: "C",
        title: "第三组",
        imageSrc: "/legacy-readings/options/group-help-C.jpg",
        text: "这个群能够给你带来一些学习啊，就还真的让你学到点东西，然后给你带来一些信息吧，就是可能第三组会看得比较多，然后就是在社交上面能够给你带来一些帮助，可能还有一些比如说人脉，身边的不好的是非啊，可能会带来一些提醒。能够给你带来一份支持，我觉得就是这个群，包括这个群里面能够产出的讯息能够给你带来一个支持，感觉就是扎根的那种，就是深深的扎根，深深的链接的那种感觉。然后可能也能够给到你一个当断则断的勇气，就是可能有的时候面临一些选择、二选一，或者说，该不该断，要不要走啊，诸如此类的，给到这么一个建议吧。"
      }
    ]
  },
  {
    slug: "parent-communication",
    title: "和父母用什么方式沟通会更好",
    imageSrc: "/legacy-readings/parent-communication.jpg",
    width: 1280,
    height: 5431,
    options: [
      {
        optionKey: "A",
        title: "第一组",
        imageSrc: "/legacy-readings/options/parent-communication-A.jpg",
        text: "选第一组的建议你跟父母写信，用文字的方式，不要面对面地去讲，而是写信或者打字。在这个过程中，你会更加成熟更加理智，会有更多思考。这样能够避免掉很多面对面的吵架存在的，可能有一些潜意识、下意识的、不自觉的带 PUA、带操控的话或者冲动的话，打字的时候很多话也不一定过脑子，但是写信这种载体就不一样，写字会让人变得沉着、专注，心也因此变得柔软。"
      },
      {
        optionKey: "B",
        title: "第二组",
        imageSrc: "/legacy-readings/options/parent-communication-B.jpg",
        text: "选择二组的，我觉得稍微有点受制于父母吧。虽然说你父母可能控制你呀，PUA 你，但是父母也给你钱。我觉得就是可以用开心的、灵活的方式去说，比如你可以去送一些礼物啊，或者说你在节假日的时候，你也可以给到父母一些祝福。就是你爸妈也给你钱，你也可以给你爸妈钱，给他们发红包，形成有来有往的流动，在这种流动的过程中，双方都很开心的一个情况下，你去进行一些沟通。"
      },
      {
        optionKey: "C",
        title: "第三组",
        imageSrc: "/legacy-readings/options/parent-communication-C.jpg",
        text: "选择第三组的，我觉得你跟父母沟通挺难的，不是很建议沟通，也不是说不建议沟通吧。就是你要想跟他们沟通，你得起飞，你明白吗？就是你得自己成为鸟儿，你才能飞过你跟你父母之间的这座山，你自己得起飞。你要想跟你父母有更好的沟通，前提就是你自己能够飞起来。然后你跟你父母之间的这座高山，你就能飞过去。就山对鸟来说是最简单最轻松的，飞过去就行了，但是对人来说很麻烦，得爬，你就先提升自己吧。"
      }
    ]
  },
  {
    slug: "jealous-around-you",
    title: "你身边有人正在嫉妒你吗",
    imageSrc: "/legacy-readings/jealous-around-you.jpg",
    width: 1280,
    height: 5431,
    options: [
      {
        optionKey: "A",
        title: "第一组",
        imageSrc: "/legacy-readings/options/jealous-around-you-A.jpg",
        text: "第一组感觉是没有的，第一组可能自己做事也是那种比较谨小慎微，或者单打独斗，我自己一个人默默做事情，默默往高处走的那种。就是你有什么成就，其实你身边的人也不知道。然后你自己也是比较传统的，很遵循老辈子的那种，财不外露，或者说事以密成的观念的，你自己还挺信这个东西的。你也不喜欢什么都说出去，都往外跟别人讲。所以身边有人嫉妒你吗？其实你身边人都不知道你现在是啥情况，他想嫉妒都没办法嫉妒。"
      },
      {
        optionKey: "B",
        title: "第二组",
        imageSrc: "/legacy-readings/options/jealous-around-you-B.jpg",
        text: "第二组呢，自己这个人群的焦点位就是风暴的中心，哪怕你躺着不动，什么都不干，背后都有人在议论你。反正你自己的人际关系处理的也是挺有问题的，可能经常容易跟别人吵架，或者你自己挺容易和人发生这种争斗矛盾之类的。第二组哪怕啥都不干，我觉得都不是嫉妒。你身边人就是要讨论你。所以第二组也挺容易跟别人撕逼什么的。反正有一些人就是讨厌你吧，就是会在背后议论你。他们也不是说看到你的成就才嫉妒你，他们可能纯恨你，哪怕你现在什么都没做，就是躺在那儿休息，啥也不干，这些人都要对你进行一番指指点点的议论。"
      },
      {
        optionKey: "C",
        title: "第三组",
        imageSrc: "/legacy-readings/options/jealous-around-you-C.jpg",
        text: "第三组能量磁场很杂乱，你的社交关系其实很乱，就是我感觉你整个人就像是在一个集市上面，有很多的这种叫卖呀、砍价呀这种利益交换，我觉得他不能说是单纯的嫉妒，当然肯定也包含了一部分嫉妒。你只能说在这个混乱的能量场里面，是可能有一部分人对你有一些出自嫉妒的恶意，或者说你的身边存在这种针对你的恶意。但是他们对你全是恶意吗？那也不完全是，就挺复杂挺乱的。"
      }
    ]
  }
];

export function getLegacyReading(slug: string) {
  return legacyReadings.find((reading) => reading.slug === slug) ?? null;
}

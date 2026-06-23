"use strict";
/* route-family.js —— 路线【儿孙满堂 family】：一条「成家→生娃→把孩子拉扯大→晚年幸福」的家庭引导线。
 * 体验主轴：先养家糊口站稳脚跟，再遇见对的人→步入婚姻→生儿育女→用心经营家庭→含饴弄孙、晚年安康。
 * 情感核心线 date(谈恋爱)→companion(陪伴爱人)→parenting(鸡娃育儿)→grandkids(含饴弄孙) 随婚育处境自然解锁。*/
(function () {
  // 是否已有想共度一生的人：登记对象 / 已成家 / 心动看对眼的人
  const hasLove = (s) => has(s, "partner") || has(s, "married") || !!(s && s.crush);

  registerRoute("family", {
    intro: "你信一句话：事业是一时的，热腾腾的一家人才是一辈子的。这一路，从养家糊口起步，去遇见对的人、组一个家、把日子焐暖。",
    // 这条线能做的事（超集）——养家糊口的工作 + date→companion→parenting→grandkids 情感核心线
    actions: ["jobhunt", "work", "parttime", "date", "companion", "parenting", "family", "grandkids", "socialize", "exercise", "browse", "rest", "relocate"],
    // 渐进解锁：以任务进度为主、年龄为辅；婚育相关行动主要靠 core.js 的 require 随处境自然出现
    unlock: {
      work: (s) => true,                                  // 养家糊口，早早就该上班赚钱
      date: (s) => true,                                  // 遇见对的人，越早越好（core.js 另有未婚<70 门槛）
      parttime: (s) => true,
      socialize: (s) => isQuestDone(s, "family", "q_partner") || s.age >= 24,
      relocate: (s) => s.age >= 22,
      exercise: (s) => true,
      rest: (s) => true,
      browse: (s) => true
    },
    lockHint: {
      socialize: "🔒 先找到想共度一生的人，再去拓圈子、攒人脉"
    },
    quests: [
      { id: "q_partner", title: "找到想共度一生的人", hint: "打开「❤️ 谈恋爱」去认识新的人、追求心动对象。一切，得先从遇见开始——养家糊口之余，别忘了给感情留点时间。",
        done: (s) => hasLove(s),
        onDone: (s) => { add(s, "mood", 6); } },
      { id: "q_married", title: "步入婚姻，成个家", hint: "感情焐熟了，就携手走进围城。多用「💑 陪伴爱人」把关系焐热，遇到求婚 / 结婚的命运线时，勇敢地许下承诺。",
        done: (s) => has(s, "married"),
        onDone: (s) => { add(s, "mood", 8); add(s, "health", 2); } },
      { id: "q_kid", title: "生儿育女，迎来新生命", hint: "成家之后，迎接小生命的到来。把日子过稳、把心情养好，遇到要孩子的命运线时点头——一个新的家庭，就此完整。",
        done: (s) => has(s, "has_kid"),
        onDone: (s) => { add(s, "mood", 10); } },
      { id: "q_raise", title: "把孩子拉扯大，用心经营家庭", hint: "孩子是一场长跑。坚持「🍼 鸡娃育儿」陪 ta 长大，用「🏡 陪伴家人」「💑 陪伴爱人」把这个家焐得有温度——别让操劳掏空了亲情。",
        done: (s) => has(s, "warm_family") || (has(s, "has_kid") && s.age >= 45),
        onDone: (s) => { add(s, "mood", 8); add(s, "reputation", 3); } },
      { id: "q_full_house", title: "儿孙满堂：晚年幸福安康", hint: "最后一程——养好身子、守住好心情，「👶 含饴弄孙」享天伦之乐。把大半生的奔波，都酿成一桌热腾腾的团圆饭。",
        done: (s) => (typeof goalDone === "function" ? goalDone(s) : (has(s, "has_kid") && s.age >= 60 && (s.mood >= 50 || s.health >= 60))) }
    ]
  });
})();

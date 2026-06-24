"use strict";
/* =====================================================================
 * content/events-campus.js —— 大三「在校这一年」事件剧本（待 Codex 接入）
 *
 * 主题：大三学生这一年的压力 / 焦虑 / 收获 / 奇遇，且【与开局背景强关联】——
 *       专业(s.major) · 家境(byClass/born_poor/silver_spoon…) · 出生地成长经历
 *       (regional_hard_village / regional_county_boarding / regional_core_city …)。
 *
 * 范式说明（给接入者 Codex）：
 *   · 这些是「主循环 VN 事件」，module:"campus"，不是旧的子循环行动。
 *   · 触发面：默认 ambient:true，由事件调度在【大三探索期 college_junior】优先抽取。
 *     本文件用 _campusOn(s) 统一判定「人在大三在校阶段」；接入时若有更准的场景钩子
 *     （如 currentScene(s).type==="campus" 或 sceneMeta.key==="school/dorm"），可在
 *     event-router / drawAmbient 里据 module==="campus" + 场景标签优先调度，并把
 *     _campusOn 收敛成同一判据。
 *   · 人生大事/一次性奇遇标 once:true（自带 5 年冷却对短短一年的大三足够）。
 *   · 所有 effect 必须 return 字符串（进人生回顾时间线）；改数值用 add()，标记用 flag()。
 *   · recordBeat(s,"first_network"/"first_intern") 用 typeof 守卫，未接入主线阶段也不报错。
 *
 * 依赖的全局 helper（均已在 core.js / jobs.js / stage-manager.js 提供）：
 *   add, flag, has, pick, rnd, byClass, classTier, majorName, recordBeat
 * ===================================================================== */

/* ---------------- 背景判定小工具（只读，不写状态） ---------------- */
// 是否处在「大三在校」阶段：优先读主线阶段，回退到「年轻+没工作+没全职创业」
function _campusOn(s) {
  if (typeof mainStageId === "function") { try { return mainStageId(s) === "college_junior"; } catch (e) { } }
  return (s.age || 21) <= 22 && !s.job && !(s.startup && s.startup.fulltime);
}
// 专业 id（兼容 s.major 为字符串 id 或 {id,...} 对象两种形态）
function _maj(s) { return (s.major && s.major.id) || s.major || null; }
function _majName(s) { return (typeof majorName === "function") ? majorName(s) : "你的专业"; }
// 家境：寒门 / 殷实
function _poor(s) { return has(s, "born_poor") || has(s, "bg_childhood_poor") || has(s, "fallen") || has(s, "regional_hard_village") || has(s, "regional_county_boarding") || (s.cash || 0) < 4000; }
function _rich(s) { return has(s, "silver_spoon") || has(s, "nouveau_riche") || (s.cash || 0) >= 200000; }
// 出身底色：小地方苦读 / 大城市夹缝 / 沿海生意人家
function _humble(s) { return has(s, "regional_hard_village") || has(s, "regional_county_boarding") || has(s, "born_poor"); }
function _bigcity(s) { return has(s, "regional_core_city"); }
function _tradefamily(s) { return has(s, "regional_coast_export_uncle") || has(s, "regional_port_child") || has(s, "regional_coast_typhoon_shop") || has(s, "family_trade"); }
// 家乡一句话（用于文案点缀，缺省兜底）
function _home(s) { return (s.birthplace && (s.birthplace.path || (s.birthplace.origin && s.birthplace.origin.note))) || "你长大的那个地方"; }

if (typeof EVENTS !== "undefined") {
  EVENTS.push(

    /* ============== 一、同辈压力 · 晒 offer 群 ============== */
    {
      id: "ev_campus_offer_flood", module: "campus", ambient: true,
      cond: s => _campusOn(s),
      title: "📱 凌晨一点，班级群又炸了",
      text: s => {
        const head = byClass(s, {
          poor: "你正躺在上铺刷着省钱攻略，群里突然弹出一张大厂 offer 截图——年薪数字后面那串零，刺得你眼睛发酸。",
          mid: "你正窝在被子里打游戏，班级群忽然热闹起来：又有人晒出了大厂 offer，配文「感谢XX，梦想成真」。",
          rich: "你刷着群消息，同学晒 offer 的截图一张接一张。你倒不太慌——家里早替你留了位置——可那股「别人都在奔跑」的躁动，还是隔着屏幕渗了过来。"
        });
        const maj = _maj(s);
        const tail = maj === "cs"
          ? "「计算机的就是好啊，闭眼都能进大厂」——有人在群里这么说。你苦笑：他们没见过你为一道算法题熬到天亮的样子。"
          : (maj === "edu" || maj === "art")
            ? `读${_majName(s)}的你，看着满屏的「offer」「年包」，心里那点对口好工作的位置，越缩越小。`
            : "保研的、考研的、签三方的、考公的……一个寝室四个人，像是被分到了四条完全不同的轨道。";
        return head + "<br><br>" + tail + "<br><br>你盯着天花板，那个一直被你往后拖的问题，今晚格外清晰：<b>毕业以后，我到底要去哪儿？</b>";
      },
      choices: [
        {
          label: "睡不着了——爬起来改简历、找实习", effect: s => {
            add(s, "stress", 6); add(s, "knowledge", 1); add(s, "mood", -2); flag(s, "campus_anxious");
            if (rnd(0.5)) add(s, "charm", 0.5);
            return "你索性开了灯，把简历又改了一版，顺手投了三家实习。焦虑没消，但至少做了点什么——比干躺着强。窗外天快亮了，你给自己定了个闹钟：明天，认真一点。";
          }
        },
        {
          label: "关掉手机：别人的节奏，不是我的", effect: s => {
            add(s, "mood", 3); add(s, "stress", -2); add(s, "insight", 0.6); flag(s, "campus_steady");
            return "你把手机扣在桌上，深吸一口气。每个人有每个人的时区——这话你不知听过多少遍，今晚第一次有点信了。睡了个踏实觉。路还长，慌什么。";
          }
        },
        {
          label: "在群里也跟着卷，问东问西打听门路", enter: s => { add(s, "network", 1); },
          next: s => ({
            text: () => "你也在群里冒了泡，挨个私聊那些晒 offer 的同学。有人爱搭不理，有人倒挺仗义，把内推码、面经、避坑指南一股脑甩给你。",
            choices: [
              {
                label: "认真收下，跟着抄作业", effect: s => {
                  add(s, "knowledge", 1); add(s, "network", 1.5); add(s, "stress", 3);
                  if (rnd(0.35)) { flag(s, "got_referral"); return "一个签了大厂的学长把内推码给了你：「试试，别浪费。」你把他给的面经存进收藏夹，命名「救命」。有人带，路就好走一截——这份人情，你记下了。"; }
                  return "你把同学们的经验整理成一份长长的文档。抄作业不丢人，少走弯路才是真本事。心里那点慌，被一条条具体的待办压住了。";
                }
              },
              {
                label: "比着比着，反而更焦虑了", effect: s => {
                  add(s, "stress", 8); add(s, "mood", -5); flag(s, "campus_anxious");
                  return "越问越觉得自己一无是处：别人有实习、有竞赛、有大佬推荐，你好像什么都没攒下。手机一黑，映出你发愁的脸。这一夜，你和那串别人的成就睡在了一起。";
                }
              }
            ]
          })
        }
      ]
    },

    /* ============== 二、家里来电 · 催问与指望（强家境/出身关联） ============== */
    {
      id: "ev_campus_parents_call", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s),
      title: "📞 妈打来的电话，第三个未接",
      text: s => byClass(s, {
        poor: `${_home(s)}的号码又跳了出来。你知道他们想问什么——隔壁谁家娃签了哪儿、你毕业能不能留在大城市、家里这点钱供你读到大三容易吗。接起来，那头是熟悉的、小心翼翼的口气：「不催你啊，就是……心里没底。」一句话，你的鼻子就酸了。`,
        mid: "妈妈的电话第三次打来。你猜得到内容：「工作想好没」「要不考个公」「你三舅说他单位还能塞人」。你深吸一口气，按下了接听键。",
        rich: "家里来电。爸早就替你打点好了——一家体面单位，或者干脆送你出国。电话那头的意思很明确：「别瞎折腾，按我说的来。」你握着手机，心里却堵着一口说不清的气。"
      }),
      choices: [
        {
          label: "报喜不报忧：「都挺好的，您别操心」", effect: s => {
            add(s, "mood", -3); add(s, "stress", 4);
            if (_poor(s)) { add(s, "stress", 3); return "你把所有的迷茫和窘迫都咽了回去，电话里全是「顺利」「不缺钱」「快了」。挂断的瞬间，房间安静得能听见自己的心跳。有些重，只能自己扛——你不想让他们跟着你一起慌。"; }
            return "你笑着把一切说得很好，挂了电话却久久没动。报喜不报忧，是这一代人最熟练的孝顺。可没人替你扛的那部分，依旧压在肩上。";
          }
        },
        {
          label: "坦白：「我也不知道以后干嘛」", effect: s => {
            add(s, "mood", 2); add(s, "stress", -3); add(s, "insight", 0.5); flag(s, "told_parents_truth");
            return "你第一次没有逞强，把心里的迷茫一股脑倒了出来。电话那头沉默了几秒，然后是一句意外的轻声：「没事，慢慢来，天塌不下来。」原来说出来，比硬扛轻松。家不是只能报喜的地方。";
          }
        },
        {
          label: "顶了回去：「我的人生我自己来」", cond: s => _rich(s) || has(s, "told_parents_truth") || true,
          enter: s => { add(s, "stress", 5); },
          next: s => ({
            text: () => _rich(s)
              ? "你把话说得很硬：「我不想要安排好的人生。」电话那头先是愕然，然后是熟悉的、带着失望的训斥。你和爸，又一次谁也说服不了谁。"
              : "你忍不住和爸妈呛了几句：「别人是别人，我是我。」话一出口就后悔了——他们不过是怕你将来吃苦。亲情和压力，本就缠在一起。",
            choices: [
              {
                label: "梗着脖子也要自己闯", effect: s => {
                  add(s, "strategy", 0.6); add(s, "mood", -2); flag(s, "campus_self_path");
                  return "争执不欢而散。但放下电话，你心里反而生出一股劲：既然要按自己的方式活，那就别让他们的担心成真。这股较劲，日后会推着你往前走。";
                }
              },
              {
                label: "冷静下来，回拨道个歉", effect: s => {
                  add(s, "mood", 3); add(s, "charm", 0.5); if (typeof bumpThread === "function") bumpThread(s, "family_pressure", -5);
                  return "气消了，你又把电话拨了回去：「妈，刚才态度不好。」那头愣了一下，随即软了：「知道你有主意就行。」有些和解，不需要谁认输——只需要一个先低头的人。";
                }
              }
            ]
          })
        }
      ]
    },

    /* ============== 三、第一份实习 · 免费劳动力（收获/压榨，可拿 first_intern） ============== */
    {
      id: "ev_campus_intern_grind", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s) && ((s.network || 0) >= 8 || has(s, "campus_anxious") || (s.age || 21) >= 21),
      title: "💼 实习第一周：你成了「那个跑腿的」",
      text: s => {
        const maj = _maj(s);
        const role = maj === "cs" ? "改不完的 bug 和别人留下的祖传屎山代码"
          : maj === "finance" ? "贴不完的票据、抓不完的数、做不完的 PPT"
            : maj === "med" ? "查房、写病历、被各级老师轮番提问"
              : maj === "law" ? "整理卷宗、检索判例、跑法院送文书"
                : maj === "art" ? "改第 N 版被甲方毙掉的设计稿"
                  : "复印、订会议室、给整个组带二十杯奶茶";
        return `你终于挤进了一家公司实习。理想里你是来「学本事」的，现实里你是来干杂活的——${role}。带教的前辈很忙，没空教你；同事客客气气，把你当个临时工具人。`
          + "<br><br>"
          + byClass(s, {
            poor: "实习补贴一天一百出头，刨去地铁和午饭，剩不下几个钱。可你不敢走——这行经历，是你简历上唯一拿得出手的东西。",
            mid: "钱不多，活不少，但你知道，这段经历写进简历，秋招时就能少被刷一轮。",
            rich: "其实你不缺这点补贴，家里也劝你别遭这份罪。可你莫名想证明：离开家里的光环，你也能靠自己挣一口饭。"
          });
      },
      choices: [
        {
          label: "忍着，把杂活也当本事偷师", effect: s => {
            add(s, "knowledge", 1.5); add(s, "strategy", 0.6); add(s, "health", -2); add(s, "network", 1);
            if (typeof recordBeat === "function") recordBeat(s, "first_intern");
            if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2);
            flag(s, "had_internship");
            const m = Math.round(400 + Math.random() * 600); add(s, "cash", m);
            return `你把每件杂活都干漂亮，趁机偷看前辈怎么做事、这门生意怎么转。月底攥着 ¥${m.toLocaleString()} 补贴，你想：钱是其次，看懂了一个真实的行业怎么运转，才是这趟没白来。简历上，终于有了一行不空的「经历」。`;
          }
        },
        {
          label: "划水摸鱼，反正没人教也没人看", effect: s => {
            add(s, "mood", 2); add(s, "stress", -2);
            if (typeof recordBeat === "function") recordBeat(s, "first_intern");
            flag(s, "had_internship");
            return "你学会了在工位上假装很忙：屏幕开着文档，手机藏在抽屉里。一段「摸鱼实习」就这么混过去了——简历上多了一行字，脑子里却没多装什么。值不值，只有将来面试官追问时才知道。";
          }
        },
        {
          label: "受够了，干脆裸辞", effect: s => {
            add(s, "mood", 4); add(s, "stress", -4); add(s, "network", -1);
            if (_poor(s)) { add(s, "stress", 5); add(s, "mood", -3); return "你把工牌往桌上一放就走了，痛快了三秒钟，电梯里就开始后悔——以你的家底，本经不起任性。回学校的地铁上，你盯着空荡荡的简历那一栏，第一次明白：穷人的体面，常常是憋出来的。"; }
            return "你受不了这份憋屈，潇洒地裸辞了。年轻人嘛，谁还没点脾气。只是回到宿舍冷静下来，你也清楚：这个任性，秋招时大概率要自己买单。";
          }
        }
      ]
    },

    /* ============== 四、期末 · 那门要挂的硬课（焦虑/收获） ============== */
    {
      id: "ev_campus_final_exam", module: "campus", ambient: true,
      cond: s => _campusOn(s),
      title: "📕 还有三天考试，这门你一节没听懂",
      text: s => {
        const maj = _maj(s);
        const course = maj === "cs" ? "《操作系统》" : maj === "finance" ? "《计量经济学》" : maj === "med" ? "《病理学》"
          : maj === "law" ? "《民法分论》" : maj === "mech" ? "《理论力学》" : maj === "art" ? "《艺术史论》" : "那门最硬的专业课";
        return `${course}的期末就在三天后。你翻开课本，密密麻麻的内容像天书——这学期忙着实习、忙着摆烂、忙着emo，唯独没忙着学习。挂科意味着重修、清考、绩点崩盘，甚至影响保研和毕业。`
          + "<br><br>"
          + (has(s, "campus_anxious") ? "本就紧绷的神经，又被拉紧了一格。" : "你第一次为绩点这种事，心跳加速。");
      },
      choices: [
        {
          label: "通宵突击，把命搭进去", effect: s => {
            add(s, "knowledge", 1.5); add(s, "stress", 8); add(s, "health", -4);
            const pass = rnd(0.55 + (s.stats.knowledge - 30) / 200);
            if (pass) { add(s, "mood", 4); return "你灌了三罐红牛，把重点啃了个七七八八。走出考场那一刻，腿是软的，但卷子答得出。后来成绩出来——飘过。你长出一口气：临时抱佛脚不可取，但这回，佛脚抱住了。"; }
            add(s, "mood", -6); flag(s, "campus_lowgpa");
            return "你熬了两个通宵，可三天补不回一学期的债。考场上大片空白，你认命地交了卷。挂了。重修费和那道补考的坎，是这学期摆烂的账单——总得有人还，那个人是你。";
          }
        },
        {
          label: "求师兄师姐/学霸的「划重点」笔记", enter: s => { if (typeof recordBeat === "function") recordBeat(s, "first_network"); },
          effect: s => {
            add(s, "network", 1.5); add(s, "knowledge", 1); add(s, "stress", 3);
            return "你厚着脸皮在群里求助，一个素不相识的学姐把她的「划重点」笔记甩给了你：「拿去，应付考试够了。」靠着这份救命稻草，你勉强过了关。你忽然懂了：在大学里，信息和人脉，有时候比智商更管用。";
          }
        },
        {
          label: "摆烂，挂了再说", effect: s => {
            add(s, "mood", 1); add(s, "stress", -3); add(s, "health", 2); flag(s, "campus_lowgpa");
            return "你合上书，决定不跟自己较劲了：「挂就挂吧，大不了重修。」你睡了个久违的好觉。痛快是真痛快，可成绩单出来那天，那个红色的「59」还是让你愣了一下——有些代价，是缓发的。";
          }
        }
      ]
    },

    /* ============== 五、图书馆奇遇 · 心动（轻松奇遇） ============== */
    {
      id: "ev_campus_library_crush", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s) && !has(s, "partner") && !has(s, "campus_romance"),
      title: "📖 你占的座，被Ta的书包占了",
      text: s => "期末季的图书馆一座难求。你起身接了杯水，回来发现座位上多了个陌生的书包，主人正一脸抱歉地看着你：「不好意思！我以为没人……」"
        + "<br><br>"
        + "你抬头，对上一双慌乱又干净的眼睛。心跳莫名漏了一拍。窗外是黄昏的梧桐，空气里是旧书和阳光晒过的味道。这一刻，期末的兵荒马乱忽然都安静了下来。",
      choices: [
        {
          label: "「没事，一起拼个桌?」", effect: s => {
            add(s, "mood", 8); add(s, "charm", 0.6); flag(s, "campus_romance");
            if (typeof recordBeat === "function") recordBeat(s, "first_network");
            s.timeline.push({ age: s.age, text: "大三的图书馆里，你和一个陌生人拼了张桌子，然后心跳就不老实了。" });
            return "你们拼了一张桌子，从复习聊到夜宵，从专业聊到各自家乡。临走加了微信，备注栏你犹豫了很久。回宿舍的路上，你哼着不成调的歌——青春里那点不计成本的心动，来得猝不及防，也来得正好。";
          }
        },
        {
          label: "礼貌点头，各自埋头看书", effect: s => {
            add(s, "knowledge", 1); add(s, "mood", 2);
            return "你客气地笑了笑，重新坐下，假装专注地翻书。余光里，对方偶尔抬头，你也偶尔走神。一下午，你一个字没看进去，却奇异地觉得充实。有些遇见，不必有结果，本身就是青春的一帧。";
          }
        }
      ]
    },

    /* ============== 六、讲座奇遇 · 校友贵人（机会/first_network，强专业关联） ============== */
    {
      id: "ev_campus_alumni_talk", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s),
      title: "📣 蹭了场讲座，台上那人后来改变了你",
      text: s => {
        const maj = _maj(s);
        const who = maj === "cs" ? "一位做出过明星 App、如今自己创业的学长"
          : maj === "finance" ? "一位投行出身、转头自己做基金的学姐"
            : maj === "med" ? "一位三甲科室主任、也是连续创业的校友"
              : maj === "art" ? "一位拿过国际奖、自立工作室的设计师前辈"
                : maj === "law" ? "一位红圈所合伙人、后来下海的学长"
                  : "一位从你们专业走出去、如今在风口浪尖的校友";
        return `你本来只是为了蹭空调和免费矿泉水，溜进了一场校友讲座。台上是${who}，讲的不是成功学，而是那些「没人告诉你的弯路」——被裁、被骗、押错赛道、深夜怀疑人生。`
          + "<br><br>"
          + "你听得入了神。讲座结束，人群散去，你鬼使神差地走上前，问了一个憋了很久的问题。对方愣了一下，认真打量了你两秒，笑了：「问得好。加个微信吧，以后有想不通的，可以问我。」";
      },
      choices: [
        {
          label: "郑重加上，把这条人脉当回事", effect: s => {
            add(s, "network", 3); add(s, "insight", 1); add(s, "mood", 4);
            if (typeof recordBeat === "function") recordBeat(s, "first_network");
            if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2);
            flag(s, "got_referral"); flag(s, "campus_mentor");
            if (typeof rememberFact === "function") rememberFact(s, { type: "favor", text: "在一场校友讲座后，认识了一位行业里的过来人。", tags: ["network", "mentor"], intensity: 2 });
            return "你们加了微信，他真的有问必答。这条偶然牵起的线，日后会在你最迷茫的路口，递给你一句关键的话——你那时还不知道，蹭空调蹭来的，是一位贵人。人生的转弯，常常藏在你随手做的某个小决定里。";
          }
        },
        {
          label: "加是加了，回头也没好意思打扰", effect: s => {
            add(s, "insight", 0.8); add(s, "mood", 2);
            return "微信躺在通讯录里，备注是那场讲座的日期。你总觉得人家是客气，不好意思真去叨扰。讲座里那几句话却记了很久——有时候，一个过来人不经意的提醒，比你自己撞十次南墙都管用。";
          }
        }
      ]
    },

    /* ============== 七、生活费窘迫（寒门专属，强家境关联） ============== */
    {
      id: "ev_campus_broke_month", module: "campus", ambient: true,
      cond: s => _campusOn(s) && _poor(s),
      title: "🍜 月底了，饭卡只剩 8 块 7",
      text: s => `离生活费到账还有十天，你的饭卡余额：8 块 7。${_home(s)}的爸妈把能挤的都挤给了你，你不忍再开口。室友约着出去搓串、点奶茶、拼单买新球鞋，你总是笑着说「我不饿」「我有事」。`
        + "<br><br>"
        + "这种小心翼翼的窘迫，没经历过的人不会懂：它不疼，但磨人。你蹲在食堂角落，就着免费的汤泡米饭，盘算着这十天怎么过。",
      choices: [
        {
          label: "去接兼职：家教、跑腿、食堂帮工", effect: s => {
            const m = Math.round(600 + Math.random() * 700); add(s, "cash", m); add(s, "stress", 3); add(s, "body", 0.4); add(s, "strategy", 0.5);
            flag(s, "campus_self_earn");
            return `你接了几份家教、抢了食堂的帮工岗，起早贪黑攒下 ¥${m.toLocaleString()}。手心磨出薄茧，可第一次花自己挣的钱，腰杆莫名挺直了些。穷不可怕，认命才可怕——这个道理，你比同龄人懂得早。`;
          }
        },
        {
          label: "申请助学金/勤工助学", effect: s => {
            const m = Math.round(800 + Math.random() * 800); add(s, "cash", m); add(s, "mood", 1); add(s, "stress", -2);
            if (rnd(0.4)) { add(s, "reputation", 1); return `你递了助学金申请，也报了图书馆的勤工助学。审批下来那天，卡里多了 ¥${m.toLocaleString()}。你在心里默默记下：这份帮助，将来有能力了要还给更需要的人。被托住过的人，才更懂得托住别人。`; }
            return `助学金名额有限，这次没轮到你，但勤工助学的岗位给了你，月入 ¥${m.toLocaleString()}。够呛但够用。你把每一分钱都算计着花，日子紧巴，心里却踏实——至少没向谁低头。`;
          }
        },
        {
          label: "硬扛：泡面、白饭、能省则省", effect: s => {
            add(s, "health", -3); add(s, "mood", -3); add(s, "stress", 4); add(s, "mind", 0.5);
            return "你靠着泡面和食堂最便宜的两个素菜，把这十天熬了过去。胃有点抗议，人也蔫蔫的。但你咬牙告诉自己：这只是暂时的。把苦日子过成段子，是穷孩子最后的体面——也是将来回头看时，最硬的底气。";
          }
        }
      ]
    },

    /* ============== 八、富二代的「空」（殷实出身专属，强家境关联） ============== */
    {
      id: "ev_campus_rich_void", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s) && _rich(s),
      title: "🥄 一切都安排好了，你却高兴不起来",
      text: s => has(s, "nouveau_riche")
        ? "家里这几年突然起来了，爸妈把「不用你操心」挂在嘴边——工作托了关系，出国也备着选项。同学们为一份实习挤破头，你却觉得这一切来得太轻易，轻得有点不真实。你说不清那种感觉：像是站在别人铺好的路上，却找不到自己的脚印。"
        : "你含着金汤匙长大，毕业去向早被安排得明明白白：进家族的生意，或者去爸的朋友那儿「镀层金」。同学们羡慕你不用愁，可只有你自己知道——被安排好的人生，像一件合身却不是你选的西装，体面，但喘不过气。",
      choices: [
        {
          label: "接受安排，体面又稳妥，何必折腾", effect: s => {
            add(s, "mood", 2); add(s, "cash", Math.round(5000 + Math.random() * 5000)); flag(s, "campus_arranged");
            return "你说服自己：有现成的路不走，是矫情。你开始按家里的剧本准备，日子顺风顺水。只是偶尔夜深，你会想起那个被你按下去的念头——「如果靠自己，我能走多远？」它没消失，只是被你暂时锁进了抽屉。";
          }
        },
        {
          label: "想自己闯一闯，哪怕摔得很难看", effect: s => {
            add(s, "strategy", 1); add(s, "insight", 1); add(s, "mood", 3); flag(s, "campus_self_path");
            if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 3);
            s.timeline.push({ age: s.age, text: "大三这年，含着金汤匙的你，偏要试试靠自己能挣出几两骨气。" });
            return "你跟家里摊了牌：「让我自己试试，赔了算我的。」爸沉默良久，扔下一句「别后悔」。你心里却前所未有地敞亮——人这一辈子，总得有一段路，是凭自己的脚走出来的。哪怕摔得难看，也比一辈子活在「安排」里强。";
          }
        }
      ]
    },

    /* ============== 九、三岔路口 · 保研/考研/秋招/考公（大三核心焦虑） ============== */
    {
      id: "ev_campus_crossroad", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s) && ((s.age || 21) >= 21),
      title: "🧭 寝室四个人，四条路",
      text: s => {
        const maj = _maj(s);
        const hint = (maj === "edu" || maj === "law") ? "你这专业，考公考编的人尤其多，宿舍墙上贴满了行测倒计时。"
          : maj === "cs" ? "你这专业，秋招进大厂的诱惑最大，可读研深造的也不少。"
            : maj === "finance" ? "你这专业，考研、保研、进券商，每条路都看着金光闪闪，又都挤得头破血流。"
              : "每条路都有人走通，也都有人走死。";
        return `期中一过，寝室的空气变了。上铺在背考研政治，对面在刷行测题，靠门那个天天往招聘会跑，还有一个，已经拿到了保研名额，整天乐呵呵。`
          + "<br><br>" + hint + "<br><br>"
          + "你坐在自己的桌前，面前摊着四份资料：考研、保研、秋招、考公。每一条都通向完全不同的人生，而你必须很快做出选择——<b>这是你长这么大，第一次为自己的命运真正发愁。</b>";
      },
      choices: [
        {
          label: "搏一把升学：考研/保研，再读几年", effect: s => {
            add(s, "knowledge", 1.5); add(s, "stress", 5); flag(s, "campus_aim_grad");
            return "你决定先不急着踏进社会，给自己再争取几年。书桌前贴上了倒计时，台灯亮到深夜。这条路苦，但你想要的，是一张更硬的入场券。方向定了，慌乱反而少了——人最怕的从来不是难，是不知道往哪儿使劲。";
          }
        },
        {
          label: "直接就业：投身秋招，早点挣钱", effect: s => {
            add(s, "strategy", 0.8); add(s, "stress", 3); flag(s, "campus_aim_job"); if (typeof recordBeat === "function") recordBeat(s, "first_intern");
            return byClass(s, {
              poor: "你算了笔账：再读几年，家里供不起，你也等不起。早点工作、早点挣钱、早点替爸妈卸下担子，是你最实在的选择。你把考研资料收进箱底，打开了招聘软件。穷人的勇敢，常常是被生活逼出来的——但那也是勇敢。",
              mid: "你想清楚了：与其在书本里再耗几年，不如早点进社会真刀真枪地练。你删掉了考研群，认真改起了简历。早一年下场，就早一年知道自己几斤几两。",
              rich: "你不缺再读书的资本，但你偏想早点证明自己。你避开家里铺好的路，一头扎进秋招的人海里——你要的，是凭本事拿到的那张工牌。"
            });
          }
        },
        {
          label: "求稳上岸：考公考编，图个安稳", effect: s => {
            add(s, "mind", 1); add(s, "stress", 4); flag(s, "campus_aim_civil");
            return "你被「稳定」两个字打动了。在这个处处是不确定的年代，一个铁饭碗，像汪洋里的一块浮木。你买齐了行测申论资料，加入了浩浩荡荡的考公大军。是不是最优解你不知道，但至少，这是一条你爸妈听了会睡得着觉的路。";
          }
        },
        {
          label: "还没想好，先都试试再说", effect: s => {
            add(s, "stress", 6); add(s, "mood", -3); add(s, "insight", 0.5); flag(s, "campus_anxious");
            return "你贪心地想着「全都要」：考研也准备、简历也投、公考也报名。结果哪条都没全力以赴，哪条都心里没底。骑墙的滋味并不好受——但也许，正是这段什么都抓、什么都怕抓不住的慌乱，逼着你最终想清楚：自己到底要什么。";
          }
        }
      ]
    },

    /* ============== 十、社团/室友 · 归属与温度（收获） ============== */
    {
      id: "ev_campus_dorm_warmth", module: "campus", ambient: true,
      cond: s => _campusOn(s),
      title: "🌃 凌晨两点的宿舍夜话",
      text: s => "熄灯后，宿舍的卧谈会照例开始。从某个明星塌房，聊到各自暗恋的人，再聊到「十年后我们会变成什么样」。黑暗里没人看得清脸，话反而说得格外真。"
        + "<br><br>"
        + "有人说怕变成自己讨厌的大人，有人说只想赚钱让爸妈过好点，有人忽然不说话了——大概是想起了什么。这帮人以后会散落天南海北，可此刻，你们还挤在这间六平米里，共享着同一段青春。",
      choices: [
        {
          label: "敞开心扉，也说说自己的怕和盼", effect: s => {
            add(s, "mood", 7); add(s, "stress", -5); add(s, "charm", 0.5); add(s, "network", 1);
            return "你也把藏着的迷茫和那点不敢说出口的野心，倒进了黑暗里。说完，对面传来一句「我懂」，还有人默默扔过来一包零食。那一夜你睡得很沉。有些羁绊，是在你最脆弱的时候，被人接住过——这份温度，能记一辈子。";
          }
        },
        {
          label: "笑着听，把心事留给自己", effect: s => {
            add(s, "mood", 4); add(s, "insight", 0.5);
            return "你大多时候在笑、在听、在接话茬，自己的那些事，到了嘴边又咽了回去。不是不信任，只是有些重量，你习惯了一个人扛。但听着室友们的心事，你也踏实——原来大家都在各自的兵荒马乱里，硬撑着长大。";
          }
        }
      ]
    },

    /* ============== 十一、网络焦虑 · 被裹挟的深夜（时代/焦虑） ============== */
    {
      id: "ev_campus_doomscroll", module: "campus", ambient: true,
      cond: s => _campusOn(s),
      title: "🌀 「文科都是服务业」「孔乙己的长衫」",
      text: s => "深夜，你又一次掉进了短视频和帖子的漩涡：「某专业天坑劝退」「35 岁被优化的程序员」「脱不下孔乙己的长衫」「上岸才是唯一出路」。算法精准地把焦虑一勺勺喂给你，每一条都像在说：你完了，你来不及了。"
        + "<br><br>"
        + (has(s, "campus_anxious")
          ? "你越刷越慌，手指却停不下来，像在按一个会疼的伤口。"
          : "凌晨三点，手机的光照着你越来越沉的脸。"),
      choices: [
        {
          label: "清醒抽离：贩卖焦虑的，没安好心", effect: s => {
            add(s, "insight", 1.2); add(s, "mood", 3); add(s, "stress", -3); flag(s, "campus_steady");
            return "你忽然反应过来：这些内容靠你的焦虑赚流量，越慌它们越赚。你把手机一扔，关了推荐。世界没那么糟，路也不止一条——能在信息洪流里拎得清的人，本身就是种稀缺的本事。这一觉，睡得久违地安稳。";
          }
        },
        {
          label: "被裹挟着，越刷越觉得自己没救", effect: s => {
            add(s, "stress", 7); add(s, "mood", -5); add(s, "health", -2); flag(s, "campus_anxious");
            return "你一条条往下刷，把每一种最坏的可能都套在自己身上：天坑、内卷、毕业即失业。等回过神，天已经蒙蒙亮，你顶着两个黑眼圈，比睡前更绝望。被算法喂大的焦虑，是这代年轻人最隐秘的内耗——你今晚，又输了一局。";
          }
        }
      ]
    },

    /* ============== 十二、专业小成就（收获，强专业分支） ============== */
    {
      id: "ev_campus_major_win", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s),
      title: "✨ 你第一次，靠专业做成了一件事",
      text: s => {
        const maj = _maj(s);
        const scene = maj === "cs" ? "你熬了几个通宵写的小工具，居然真的跑起来了——还被同学转着用，GitHub 上多了几颗星。"
          : maj === "finance" ? "学院模拟炒股大赛，你凭着对一个冷门板块的判断，杀进了前三。"
            : maj === "med" ? "见习时，你凭一个不起眼的细节提醒了带教老师，避免了一次误判，被当众表扬。"
              : maj === "law" ? "模拟法庭上，你作为辩方，一段陈词把对面问得哑口无言，旁听席响起掌声。"
                : maj === "art" ? "你的作品被选进了院展，开幕那天，有陌生人在你的画前站了很久。"
                  : maj === "mech" ? "你们组的小车在机器人比赛里跑赢了，那台你亲手调试到深夜的破玩意儿，争气了。"
                    : maj === "edu" ? "第一次站上讲台试讲，台下几十双眼睛看着你——下课铃响时，有学生说「老师再讲会儿」。"
                      : "你认真打磨的一份课程作业，被老师当成范本，在全班面前展示。";
        return scene + "<br><br>"
          + "那一刻，那些被你怀疑过无数次的「这专业有什么用」，忽然有了答案。原来你不是一无是处，原来你选的这条路，真的能长出东西来。一种久违的、踏实的成就感，从心底冒了出来。";
      },
      choices: [
        {
          label: "趁热打铁，往这个方向深挖", effect: s => {
            add(s, "knowledge", 2); add(s, "insight", 1); add(s, "mood", 6); add(s, "reputation", 1);
            flag(s, "campus_pro_spark");
            if (typeof rememberFact === "function") rememberFact(s, { type: "skill", text: "大三时第一次靠专业做成了一件让自己骄傲的事。", tags: ["skill", "campus"], intensity: 2 });
            return "你决定顺着这点火苗使劲，把更多时间砸进去钻研。热爱被一次小小的成功点着了，烧起来就很难灭。你隐约觉得，毕业后那条模糊的路，因为这件事，清晰了一点点。";
          }
        },
        {
          label: "高兴一下，但不敢太当真", effect: s => {
            add(s, "mood", 4); add(s, "knowledge", 0.8);
            return "你美滋滋了好几天，但很快又被「这能当饭吃吗」的现实拉了回来。你把那份骄傲悄悄收好，没敢声张。可它没真的消失——将来某个你想放弃的深夜，它会跳出来提醒你：你是行的，你做到过。";
          }
        }
      ]
    },

    /* ============== 十三、说走就走 · 一次逃离（奇遇/青春） ============== */
    {
      id: "ev_campus_escape", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s),
      title: "🎸 「翘了吧，去看场演唱会」",
      text: s => "周五下午，朋友突然甩来一条消息：「他们乐队来隔壁城市了，最后两张票，走不走？」下午还有一节水课，钱包也不太鼓，理智说不行——可窗外的春天太好了，好得让人想干点傻事。"
        + "<br><br>"
        + "你看着那条消息，手指悬在屏幕上。大学这几年，你好像总在为以后打算，从来没为「当下」疯过一次。",
      choices: [
        {
          label: "去！青春就这么几年", effect: s => {
            const cost = Math.round(300 + Math.random() * 400); add(s, "cash", -cost); add(s, "mood", 12); add(s, "stress", -8); add(s, "health", 2); add(s, "charm", 0.5);
            flag(s, "campus_youth_memory");
            s.timeline.push({ age: s.age, text: "大三的某个春天，你翘课跑去看了场演唱会，扯着嗓子和一万人合唱。" });
            return `你说走就走，花了 ¥${cost} 买票挤火车。全场灯光亮起、一万人跟着合唱的那一刻，你扯着嗓子喊到失声，眼眶发热。值不值？太值了。这种不计后果的痛快，往后越长大越奢侈——你庆幸，年轻时没把自己活成一张时刻表。`;
          }
        },
        {
          label: "算了，还是去上课/省点钱", effect: s => {
            add(s, "knowledge", 0.6); add(s, "mood", -2);
            return "你回了句「下次吧」，把手机扣下，继续翻书。理智是对的，可那个下午你一个字也没看进去，老想着此刻的现场该有多热闹。有些「下次」，后来再也没来过。成熟的代价之一，大概就是越来越不敢冲动。";
          }
        }
      ]
    },

    /* ============== 十四、兼职骗局 · 校园贷诱惑（陷阱/奇遇，偏寒门） ============== */
    {
      id: "ev_campus_scam_trap", module: "campus", ambient: true, once: true,
      cond: s => _campusOn(s) && ((s.cash || 0) < 30000),
      title: "💸 「学生也能做，日结三百，先交个押金」",
      text: s => (_poor(s)
        ? "你正为生活费发愁，一条兼职广告恰好砸进来：「轻松日结三百，学生优先，名额不多」。介绍人是个「学长」，热情得过了头，一口一个「带你赚钱」。"
        : "群里有人发兼职：「刷单/打字/拉人头，日结三百，先交 200 押金激活账号」。你本不缺这点钱，可那「轻松躺赚」的说辞，还是让你多看了两眼。")
        + "<br><br>"
        + "对方催得急：「就剩两个名额了，要不要？押金做完第一单就退。」你心里有根弦动了一下——是机会，还是坑？",
      choices: [
        {
          label: "天上不会掉馅饼，果断拉黑", effect: s => {
            add(s, "insight", 1.2); add(s, "strategy", 0.6); add(s, "mood", 2); flag(s, "campus_streetwise");
            return "你想起反诈中心那句「凡是先交钱的兼职都是骗子」，二话不说拉黑了对方。后来果然听说班里有人被骗了好几千。你拍拍胸口——在这个遍地是坑的世界里，能识破套路，本身就是一种保命的本事。";
          }
        },
        {
          label: "试一单看看，反正押金会退", effect: s => {
            const loss = Math.round(200 + Math.random() * 1800); add(s, "cash", -loss); add(s, "stress", 8); add(s, "mood", -8); flag(s, "campus_scammed");
            if (_poor(s)) add(s, "mood", -4);
            return `你交了押金，做了「第一单」，对方说「再做一单大的就一起结」。等你反应过来，人已经把你拉黑，群也解散了——${loss} 块钱打了水漂。${_poor(s) ? "这点钱，是你省吃俭用攒下的，疼得钻心。" : "钱不多，但被当傻子耍的憋屈，比丢钱更难受。"}你把这次教训记得死死的：贪小便宜，常常要付大代价。`;
          }
        }
      ]
    }

  );
}

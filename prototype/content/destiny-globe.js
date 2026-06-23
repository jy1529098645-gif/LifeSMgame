"use strict";
/* =====================================================================
 * content/destiny-globe.js —— 命运线【环游世界 globe】
 * 母题：「打工是不可能打工的」——钱多钱少无所谓，趁活着，把脚印留在
 *       尽可能多的地方。把人生过成一场没有终点的旅途。
 * 五幕脊柱（确定性、按阶段推进，前幕选择在后幕/清算回收）：
 *   1 序·远方     19岁  第一次萌生「我要看遍世界」的念头
 *   2 起·第一次出走 26岁  第一次真正长途出走/间隔年，家里反对 vs 不顾一切 vs 折中
 *   3 折·钱与牵绊  34岁  积蓄耗尽/家里出事/一段感情——继续漂 vs 为某人某事停下
 *   4 危·定居诱惑  43岁  安稳的家/事业/伴侣摆在面前，漂够了就停下吧
 *   5 巅·此心安处  55岁  晚年回望，成败读 placesSeen>=6 + 是否坚持上路的伏笔
 * 走过的地方数记在 s.placesSeen（数字）；偶尔 add(s,"placesSeen",1) 呼应主题。
 * 记录抉择用 dstChoose(s, chId, key, note)；回收用 dstPick / has(s,"dst_pick_*")。
 * ===================================================================== */
(function () {

  // —— 综合「漂泊底气」：决定能不能继续上路的关键判定，越高越自在 ——
  function roamSpirit(s) {
    const st = s.stats || {};
    return (st.insight || 0) + (s.mood || 0) * 0.4 + (s.health || 0) * 0.3
         + (s.placesSeen || 0) * 6 + (s.cash > 0 ? Math.min(s.cash / 20000, 8) : 0);
  }

  registerDestiny("globe",
    {
      name: "环游世界", motif: "打工是不可能打工的",
      acts: ["序·远方", "起·出走", "折·牵绊", "危·定居诱惑", "巅·此心安处"],
      // —— 母题清算：回收一生的命运抉择 ——
      reckon: function (s) {
        const seen = (s.placesSeen || 0);
        const roamed = seen >= 6;
        const everLeft = has(s, "dst_pick_globe_leave") || has(s, "dst_pick_globe_allin");
        const keptGoing = has(s, "dst_pick_globe_drift") || has(s, "dst_pick_globe_roamon");
        const settled = has(s, "dst_pick_globe_settle") || has(s, "dst_pick_globe_stop");
        if (roamed && keptGoing) {
          return "你走遍了天涯，从没让任何一道门把你关住。" + seen + " 座城、" + seen + " 段路，"
            + "全都成了你身体里的一部分。「打工是不可能打工的」——你这辈子都没向那张工位低过头，"
            + "把一生过成了辽阔的旅途。脚下是路，头顶是天，这就是你想要的自由，你一寸不差地拿到了。";
        }
        if (roamed && settled) {
          return "你到底是走过了 " + seen + " 座城的人，远方在你心里留下了再也擦不掉的底色。"
            + "后来你为某个人、某处屋檐停下了脚步——可你不后悔。看过那么多地方的人才懂，"
            + "停下来，也是因为终于找到了愿意停的地方。漂泊与归宿，你都尝过了。";
        }
        if (roamed) {
          return "你走遍了 " + seen + " 座城，把脚印撒得到处都是。这一生没攒下多少钱，"
            + "却攒下了别人一辈子都看不完的风景。值不值，只有你自己心里那本账最清楚——而它，是满的。";
        }
        if (everLeft) {
          return "你曾真的背起行囊走出去过，可后来生活的牵绊一根根缠上来，路越走越短。"
            + "「看遍世界」的念头你没能走到底，那些没去成的地方，成了你心口一处温柔的遗憾。"
            + "但你至少出走过——比那些只在地图上做梦的人，你多走了好远。";
        }
        return "你这一生，远方始终在召唤，你却始终没能真正出发。安稳、钱包、放不下的牵绊，"
          + "一次次把你按回原地。临了你才发现，最远的距离，是心在路上，人却一直没动。"
          + "那句「打工是不可能打工的」，你嘴上说着，脚却从没迈出去。";
      }
    },
    [

      /* ========== 第1幕 序·远方（19岁）：萌生念头 ========== */
      {
        id: "dst_globe_1", at: { minAge: 19, stage: ["youth"] },
        title: "🌍 十九岁，远方第一次叫了你的名字",
        text: (s) => byClass(s, {
          poor: "你蹲在出租屋的窗台上刷别人的旅行照片，指尖划过一座座没听过名字的城。兜里没几个钱，可有个念头突然烫得你坐不住：打工是不可能打工的——这辈子，我得趁活着，把脚印留到尽可能多的地方去，哪怕一路搭车、睡车站。",
          mid: "课本摊在桌上，你的眼神却飘到了世界地图那一角。同学都在聊考公、考研、找份稳定工作，你心里却憋着一句说不出口的话：人这一生，难道就为了在一个格子里坐到老？不——我要去看看外面，看遍尽可能多的地方。",
          rich: "家里早给你铺好了路：好工作、好房子、好前程。可你站在自家落地窗前，看着楼下川流的人，只觉得憋闷。你忽然想通了一件事：钱和位子留不住人的心，路才能。说走就走，去看遍这个世界——这才是你想要的活法。"
        }),
        choices: [
          { label: "心驰神往：把世界地图贴满整面墙，立下走遍的志", effect: (s) => {
              add(s, "insight", 3); add(s, "mood", 5); add(s, "stress", -2);
              return dstChoose(s, "dst_globe_1", "globe_dream",
                "你把一张大大的世界地图钉上墙，每一座想去的城都插了根针。从这天起，你的人生有了一个方向——不是向上，是向远。");
            } },
          { label: "脚踏实地：先攒够第一笔盘缠，路要一步步走", effect: (s) => {
              add(s, "strategy", 3); add(s, "insight", 2);
              return dstChoose(s, "dst_globe_1", "globe_save",
                "你没头脑发热。你算了笔账：远方很贵，可它值。你开始攒钱、做攻略，把每一分自由都提前规划好——路是梦出来的，也是攒出来的。");
            } },
          { label: "小试身手：先来一场说走就走的近郊穷游", effect: (s) => {
              add(s, "placesSeen", 1); add(s, "mood", 4); add(s, "insight", 2); add(s, "cash", -300);
              return dstChoose(s, "dst_globe_1", "globe_taste",
                "你没等，背上包就去了邻省。一夜火车，一座陌生的城。当晨光照在没见过的街道上时，你彻底确认了：这种心跳，你这辈子都戒不掉。");
            } }
        ]
      },

      /* ========== 第2幕 起·第一次出走（26岁）：间隔年 ========== */
      {
        id: "dst_globe_2", at: { minAge: 26 },
        title: "🎒 二十六岁，背包就在门口",
        text: (s) => {
          const dream = dstPick(s, "dst_globe_1") === "globe_dream";
          return (dream
            ? "墙上的地图你看了七年，针越插越多，人却一直没走。今年，你终于决定不再只是看着它。"
            : "工作几年，攒下一点钱，也攒下一肚子对格子间的厌倦。一个声音越来越响：再不走，就真的走不了了。")
            + "你想给自己放一个间隔年，真正地长途出走一次。可家里炸了锅：好好的工作不要，跑出去『瞎晃』？这一关，怎么过？";
        },
        choices: [
          { label: "不顾一切：辞职、退租，背上包就走", next: (s) => ({
              text: "你递了辞呈，退了房，把家当塞进一个登山包。父母在电话那头气得发抖，说你『不务正业、迟早后悔』。你站在车站，听着检票广播，第一次尝到了自由那又轻又重的滋味。",
              choices: [
                { label: "走得彻底：买张最远的票，半年不回头", effect: (s) => {
                    add(s, "placesSeen", 3); add(s, "insight", 5); add(s, "mood", 10);
                    add(s, "cash", -25000); add(s, "stress", 4); bumpMomentum(s, 8);
                    return dstChoose(s, "dst_globe_2", "globe_allin",
                      "你一口气走了三座城。语言不通、囊中羞涩，可你睡过海边的青旅、搭过陌生人的顺风车、在异国的清晨被钟声叫醒。这半年，比过去二十六年加起来都更像活着。");
                  } },
                { label: "走得聪明：边走边打零工，做个数字游民", effect: (s) => {
                    add(s, "placesSeen", 2); add(s, "insight", 4); add(s, "strategy", 3);
                    add(s, "mood", 6); add(s, "cash", -6000); bumpMomentum(s, 6);
                    return dstChoose(s, "dst_globe_2", "globe_allin",
                      "你学会了一边漂一边挣：接点远程的活、在青旅打工换宿。钱不多，但够你慢慢地走。你发现，原来不必『先有钱再上路』——路本身，就能养活在路上的人。");
                  } }
              ]
            }) },
          { label: "折中短途：先请长假，来一次试水的短途旅行", effect: (s) => {
              add(s, "placesSeen", 1); add(s, "insight", 3); add(s, "mood", 5); add(s, "cash", -5000);
              return dstChoose(s, "dst_globe_2", "globe_short",
                "你没敢和过去一刀两断，跟公司磨来一个长假，去了趟一直惦记的地方。脚步是迈出去了，只是心里那根线，还连着身后的安稳。这一步，半新半旧。");
            } },
          { label: "暂且留下：再等等，等更有把握了再出发", effect: (s) => {
              add(s, "cash", 8000); add(s, "mood", -6); add(s, "stress", 3);
              return dstChoose(s, "dst_globe_2", "globe_wait",
                "你最终没走。父母的劝、稳定的薪水、说不清的胆怯，把你又按回了工位。你安慰自己『再攒攒、再等等』，可你也隐隐知道，有些『等』，是走不出去的开始。");
            } }
        ]
      },

      /* ========== 第3幕 折·钱与牵绊（34岁）：继续漂 or 停下 ========== */
      {
        id: "dst_globe_3", at: { minAge: 34 },
        title: "💸 三十四岁，路与家在两头拽你",
        text: (s) => {
          const wait = dstPick(s, "dst_globe_2") === "globe_wait";
          return (wait
            ? "蹉跎到三十四岁，你才真正攒够勇气重新上路。可偏偏这时候，麻烦也一起找上了门。"
            : "漂了这些年，脚印越撒越远，账户却越来越薄。就在你盘算下一程时，家里来了电话——")
            + "积蓄快见底，老家又传来父母病倒的消息；身边还有个人，红着眼问你『能不能别走了，留下来陪我』。远方第一次，和牵绊正面撞上。怎么选？";
        },
        dynamicChoices: (s) => ([
          { label: "继续漂：路还没走完，我停不下来", next: (s) => ({
              text: "你买了机票，也给家里打了笔钱、托了人照应。你知道这有点狠心，可你更怕的是停下——停下一次，也许就再也走不动了。你背起包，又一次走向了登机口。",
              choices: [
                { label: "省着走：从此专挑穷游路线，把每分钱花在路上", effect: (s) => {
                    add(s, "placesSeen", 2); add(s, "insight", 4); add(s, "mood", 6);
                    add(s, "cash", -3000); add(s, "stress", 5); bumpMomentum(s, 6);
                    return dstChoose(s, "dst_globe_3", "globe_drift",
                      "你把旅行降到最省：沙发客、长途巴士、街边小馆。物质少得可怜，地图上的针却又多了两根。你越来越确信，让你富足的从来不是钱，是没看够的远方。");
                  } },
                { label: "带着走：把那个人也拉上路，两个人一起漂", effect: (s) => {
                    add(s, "placesSeen", 2); add(s, "mood", 10); add(s, "insight", 3);
                    add(s, "cash", -8000); bumpMomentum(s, 7);
                    return dstChoose(s, "dst_globe_3", "globe_drift",
                      "你没丢下 TA，而是说服 TA 和你一起走。两个背包，一条路。事实证明，对的人不会拖住你的脚，反而让远方变得有人可分享。这是你这辈子最划算的一笔『盘缠』。");
                  } }
              ]
            }) },
          { label: "为某人某事停下：先把家里和身边人安顿好", next: (s) => ({
              text: "你退了机票，回了老家。守在父母床前的那些夜里，你第一次觉得，远方那么远，眼前的人那么近。你告诉自己，路不会跑，先把该担的担子担起来。",
              choices: [
                { label: "暂停不告别：把地图收进抽屉，心里给远方留着位置", effect: (s) => {
                    add(s, "mood", 2); add(s, "health", 4); add(s, "cash", 12000); add(s, "stress", 6);
                    return dstChoose(s, "dst_globe_3", "globe_pause",
                      "你停了下来，照顾家人、赚钱还债。地图被你收进了抽屉最底层——不是扔掉，是留着。你对自己说：等忙过这一阵，我还要走的。这个『等』，你是认真的。");
                  } },
                { label: "就此安定：买张返程的票，把漂泊的日子翻篇", effect: (s) => {
                    add(s, "mood", -4); add(s, "cash", 20000); add(s, "health", 5); add(s, "stress", -4);
                    return dstChoose(s, "dst_globe_3", "globe_stop",
                      "你做了那个最现实的决定：留下来，找份稳定的活，把漂的日子翻了篇。夜深时偶尔翻到旧照片，心里会空一下——可你说服自己，这就是长大该有的样子。");
                  } }
              ]
            }) }
        ])
      },

      /* ========== 第4幕 危·定居的诱惑（43岁）：定居 or 继续走 ========== */
      {
        id: "dst_globe_4", at: { minAge: 43 },
        title: "🏡 四十三岁，一个『家』摆在了你面前",
        text: (s) => {
          const stopped = dstPick(s, "dst_globe_3") === "globe_stop" || dstPick(s, "dst_globe_3") === "globe_pause";
          return (stopped
            ? "停下来的这些年，日子一天天熨帖起来：一份还过得去的事业，一个愿意和你过下去的人，一套差点就能首付的房。所有人都说，你『终于安定下来了』。"
            : "漂到四十三岁，身体不如从前，钱包也总是吃紧。这时，一个安稳的归宿向你招手：稳定的工作、踏实的伴侣、一个能叫『家』的地方。")
            + "『漂够了，就停下吧。』中年的拉扯，从没有这一刻这么重。这一关，你和心里那个永远在路上的自己，正面较劲。";
        },
        choices: [
          { label: "继续走：四十三岁也不算晚，远方还在等我", next: (s) => ({
              text: "你婉拒了那份安稳。你照镜子，鬓角是白了点，可眼里那团火还没灭。你对自己说：人这一生，最怕的不是老，是还没看够就认了命。你又一次打点起行装。",
              choices: [
                { label: "慢游深行：不再赶路，一座城住上几个月", effect: (s) => {
                    add(s, "placesSeen", 1); add(s, "insight", 5); add(s, "mood", 9);
                    add(s, "health", 2); add(s, "cash", -10000); bumpMomentum(s, 8); flag(s, "globe_lifelong");
                    return dstChoose(s, "dst_globe_4", "globe_roamon",
                      "你换了种漂法：不再打卡式赶路，而是在每座城慢慢地住下来，像个当地人那样生活。中年的远方，少了几分莽撞，多了几分把日子过进风景里的从容。");
                  } },
                { label: "破釜沉舟：变卖家当，把后半生彻底交给路", effect: (s) => {
                    add(s, "placesSeen", 2); add(s, "insight", 4); add(s, "mood", 8);
                    add(s, "cash", 30000); add(s, "stress", 6); bumpMomentum(s, 9); flag(s, "globe_lifelong");
                    return dstChoose(s, "dst_globe_4", "globe_roamon",
                      "你卖了能卖的，断了能断的牵绊，把后半生整个押给了远方。有人说你疯，可你前所未有地清醒：人一辈子能为自己活的时光不多，你决定一分都不浪费。");
                  } }
              ]
            }) },
          { label: "半漂半定：安一个家当作据点，能走时再走", effect: (s) => {
              add(s, "placesSeen", 1); add(s, "mood", 6); add(s, "health", 4);
              add(s, "cash", 5000); add(s, "stress", -3);
              return dstChoose(s, "dst_globe_4", "globe_halfway",
                "你找到了一个折中：安下一个小小的据点，有人、有屋檐，可门永远朝外开着。攒够假就走，玩累了就回。家是港湾，不是牢笼——这样的活法，你终于不必再二选一。");
            } },
          { label: "就此定居：漂够了，是时候停下来好好生活", effect: (s) => {
              add(s, "mood", 5); add(s, "health", 6); add(s, "cash", 40000); add(s, "stress", -8);
              return dstChoose(s, "dst_globe_4", "globe_settle",
                "你终于把背包挂上了墙。一份安稳的工作，一个温热的家，一日三餐有人等。你对自己说：看过那么多地方的人，是有资格停下来的。漂泊画上句号，生活刚刚开始——你这样相信着。");
            } }
        ]
      },

      /* ========== 第5幕 巅·此心安处（55岁）：晚年回望 ========== */
      {
        id: "dst_globe_5", at: { minAge: 55 },
        title: "🌄 五十五岁，回头看那一路脚印",
        text: (s) => {
          const seen = (s.placesSeen || 0);
          const lifelong = has(s, "globe_lifelong");
          if (lifelong) {
            return "五十五岁的某个清晨，你又一次在陌生的窗前醒来。这些年走过的城，你已经数不太清了。"
              + "有人问你累不累，想不想停。你望着窗外那条还没走过的街，心里只有一句话：路还在，那就再走一程。";
          }
          if (seen >= 6) {
            return "五十五岁，你翻着这一生的相册：" + seen + " 座城、" + seen + " 段路，密密麻麻。"
              + "你早不年轻了，可远方在你心里从没褪色。你问自己：这把年纪，还能不能、还要不要，再为自己上一次路？";
          }
          return "五十五岁，你坐在熟悉的窗前，地图早就泛了黄。那么多想去的地方，最终只去成了寥寥几处。"
            + "夕阳照进来，你忽然很想知道：如果此刻还来得及，你愿不愿意，为年轻时那个梦，最后再走一次？";
        },
        dynamicChoices: (s) => {
          const seen = (s.placesSeen || 0);
          const lifelong = has(s, "globe_lifelong");
          const everKept = has(s, "dst_pick_globe_drift") || has(s, "dst_pick_globe_roamon");
          return [
            { label: "再上一次路：趁还走得动，去那座一直没去的城", effect: (s) => {
                let p = 0.4 + roamSpirit(s) / 80 + (lifelong ? 0.15 : 0) + (everKept ? 0.08 : 0) + luckBias(s);
                const win = rnd(p);
                add(s, "stress", 4);
                if (win) {
                  add(s, "placesSeen", 1); add(s, "insight", 5); add(s, "mood", 18);
                  add(s, "health", 2); bumpMomentum(s, 14); flag(s, "globe_capped");
                  return dstChoose(s, "dst_globe_5", "globe_lastroad",
                    "你真的又出发了。当你站在那座惦念了一辈子的城里，海风吹起你花白的头发，你笑出了眼泪。原来一个人只要还愿意上路，就永远没有老到走不动的那天。这一程，是你给自己一生的句号——圆的。");
                }
                add(s, "mood", 6); add(s, "health", -3); bumpMomentum(s, 4);
                return dstChoose(s, "dst_globe_5", "globe_lastroad",
                  "你终究还是出发了，只是这一趟走得吃力，身子骨提醒你岁月不饶人。你没能走到最想去的那处，但坐在归途的车窗边，你并不遗憾——人这辈子，肯一直走到走不动为止，已经胜过太多人。");
              } },
            { label: "回望此生：把脚印整理成一本只属于你的书", effect: (s) => {
                add(s, "insight", 6); add(s, "mood", 12); add(s, "stress", -10);
                flag(s, "globe_capped");
                return dstChoose(s, "dst_globe_5", "globe_lookback",
                  (seen >= 6
                    ? "你把这些年的车票、照片、随手记下的字，整理成厚厚一本。" + seen + " 座城在纸上重新活了过来。你合上本子，心里一片辽阔的安宁——这一生没攒下家产，却把世界，揣进了胸口。"
                    : "你把不多的几趟旅程仔细收好，每一张票根都摩挲了很久。去过的地方虽少，可它们曾让你真切地活过。你轻轻合上本子，对那个没走远的自己，说了声『辛苦了』。"));
              } },
            { label: "此心安处：远方在心里，脚步可以歇下了", effect: (s) => {
                add(s, "mood", 14); add(s, "health", 6); add(s, "stress", -12);
                flag(s, "globe_capped");
                return dstChoose(s, "dst_globe_5", "globe_atpeace",
                  "你不再向往别处了。这些年走过的路，早把远方种进了你心里——如今坐在哪儿，哪儿就是风景。你终于懂了那句老话：此心安处，便是吾乡。脚步停下，心却比任何时候都辽阔。");
              } }
          ];
        }
      }

    ]);

})();

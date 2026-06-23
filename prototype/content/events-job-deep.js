"use strict";
/* ==================================================================
 * content/events-job-deep.js —— 职场板块【深度事件】扩展模块
 * 主题：跳槽谈薪 / 晋升答辩 / 老板 PUA / 裁员 N+1 谈判 / 办公室政治
 *       / 副业转正 / 35 岁中年危机 / 带新人。
 * 经典 <script> 全局作用域：EVENTS 已存在，直接 push；
 * 只用全局 helper（add/flag/has/pick/rnd/byClass/classTier/shuf/
 * socialShift/socialBoostRole）；内部辅助一律 jobx_ 前缀。
 * ================================================================== */

// —— 内部辅助：随机一个虚构同事/对手姓名 ——
function jobx_pickName() {
  return pick(["老周", "王磊", "小林", "陈姐", "阿哲", "刘工", "赵敏", "小吴", "张总监"]);
}
// —— 谈判成功率：基础 + 谋略/魅力加成（封顶 0.9） ——
function jobx_negoRate(s, base) {
  const p = base + s.stats.strategy / 250 + s.stats.charm / 300;
  return Math.min(0.9, p);
}

/* ① 跳槽谈薪：HR 压价 */
EVENTS.push({
  id: "ev_jobx_offer_haggle", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 23,
  title: "💼 新 offer 的拉锯",
  text: (s) => "你拿到一家公司的口头 offer，HR 小赵在电话那头压价：“你现在的薪资我们核实过了，能给你涨 5% 已经很有诚意，行业都在降本。”你心里默算，这点涨幅根本不够换工作的折腾。",
  choices: [
    { label: "亮出竞品 offer 抬价", next: (s) => ({
        text: (s) => "你不动声色：“说实话，我手上还有一家给到涨 30%，我更看好你们平台，但薪资差太多不好向家里交代。”电话那头沉默了几秒。",
        choices: [
          { label: "咬死数字，不松口", effect: (s) => {
              add(s, "stress", 5);
              if (rnd(jobx_negoRate(s, 0.35))) { add(s, "cash", 40000); add(s, "strategy", 2); flag(s, "job_hopped"); return "小赵请示后回电：“争取到涨 22%，签吗？”你假装犹豫了三秒，点了头。一通电话,多出小半年的钱。"; }
              add(s, "mood", -4); return "HR 客气地收了线：“那您再考虑下别家，祝您发展顺利。”——你把一手好牌，打成了僵局。"; } },
          { label: "服个软，留余地", effect: (s) => {
              add(s, "cash", 18000); add(s, "insight", 2); flag(s, "job_hopped");
              return "你退了一步：“涨 15% 加上签字费，我马上签。”小赵爽快答应。没拿到最高价，但稳稳上岸。"; } }
        ]
      }) },
    { label: "接受 5%，图个安稳", effect: (s) => { add(s, "mood", -3); add(s, "insight", 1); return "你点了头。换了个东家，工资却没换出花来。安稳是安稳，就是夜里偶尔会想，自己是不是太好说话了。"; } }
  ]
});

/* ② 跳槽谈薪：竞业协议博弈 */
EVENTS.push({
  id: "ev_jobx_noncompete", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 26,
  title: "📑 竞业协议的陷阱",
  text: (s) => { const r = jobx_pickName(); return `离职面谈，HR ${r} 推过来一份补充协议：“按公司惯例，离职后两年内不能去同行，竞业补偿按基本工资 30% 发。”你扫了一眼那串数字——这是要把你按在原地两年。`; },
  choices: [
    { label: "逐条抠合同细节", next: (s) => ({
        text: (s) => "你指着条款：“补偿基数应当是离职前月均工资，不是基本工资。而且竞品范围写得太宽,涵盖了大半个行业。”HR 愣了一下,去叫了法务。",
        choices: [
          { label: "据理力争，要求改基数", effect: (s) => {
              add(s, "stress", 6);
              if (rnd(jobx_negoRate(s, 0.4))) { add(s, "cash", 25000); add(s, "knowledge", 2); add(s, "reputation", 2); return "法务核对法条后让了步,补偿基数按月均工资算,竞品范围也缩窄。临走还多拿一笔——懂法的人,不好欺负。"; }
              add(s, "mood", -3); return "法务态度强硬:“这是标准模板,要么签要么走仲裁。”你算了算时间成本,最终还是签了。"; } },
          { label: "干脆放弃补偿换自由", effect: (s) => {
              add(s, "cash", -12000); add(s, "strategy", 2); flag(s, "free_to_jump");
              return "你提出:“补偿我不要了,把竞业条款一并删掉。”公司乐得省钱。你少拿了一笔,却换回了去任何地方的自由。"; } }
        ]
      }) },
    { label: "签了，老实待业两年", effect: (s) => { add(s, "cash", 9000); add(s, "stress", 3); return "你签了字。接下来两年只能领着那点补偿,眼睁睁看着同行风生水起,自己却被一纸协议困在岸边。"; } }
  ]
});

/* ③ 晋升答辩：评委刁难 + 同事竞争 */
EVENTS.push({
  id: "ev_jobx_promotion_defense", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 27 && !has(s, "promoted"),
  title: "📊 晋升答辩日",
  text: (s) => { const r = jobx_pickName(); return `职级评审会,会议室里坐着五位评委。和你竞争同一个名额的是${r},他的 PPT 做得花团锦簇。轮到你述职,一位评委推了推眼镜:“你说的这个项目,核心难点到底是什么?别只报数字。”`; },
  choices: [
    { label: "稳住,直击技术深水区", next: (s) => ({
        text: (s) => "你调出架构图,从瓶颈讲到取舍,把那个所有人都绕不开的难题拆给评委看。会议室安静下来,几位评委开始点头记笔记。",
        choices: [
          { label: "顺势把功劳框死在自己名下", effect: (s) => {
              add(s, "stress", 4);
              if (rnd(jobx_negoRate(s, 0.45) + s.stats.knowledge / 300)) { flag(s, "promoted"); add(s, "cash", 30000); add(s, "reputation", 5); socialShift(s, 4); return "你逻辑严密,数据扎实,把对手衬得像在念稿。结果公示:你升了。涨薪加签字,这场仗赢得漂亮。"; }
              add(s, "reputation", -2); return "你讲得太满,有评委皱眉:“团队的功劳,全成你一个人的了?”名额最后给了更会做人的对手。"; } },
          { label: "主动提团队,显格局", effect: (s) => {
              add(s, "network", 4); add(s, "insight", 2);
              if (rnd(jobx_negoRate(s, 0.4) + s.stats.knowledge / 300)) { flag(s, "promoted"); add(s, "cash", 26000); add(s, "reputation", 4); return "你把硬骨头讲透,又点名感谢了配合的同事。评委交换了眼神:“有技术,也有担当。”你顺利晋级。"; }
              add(s, "mood", -3); return "你讲得谦逊得体,可惜名额有限,这次惜败。评委私下安慰:“你很稳,下次一定。”"; } }
        ]
      }) },
    { label: "紧张了,照着稿子念", effect: (s) => { add(s, "stress", 5); add(s, "mood", -4); return "你低头念稿,声音越来越小。评委的目光飘向了对手那份漂亮的 PPT。名额,与你擦肩而过。"; } }
  ]
});

/* ④ 老板 PUA / 画饼加班 */
EVENTS.push({
  id: "ev_jobx_boss_pua", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 24,
  title: "🫠 深夜加班与那张饼",
  text: (s) => "晚上十点,工位只剩你和老板。他端着保温杯踱过来:“小伙子,我看好你。明年公司上市,你就是元老,期权够你在这座城市买房。眼下嘛,先把这个季度的活扛下来。”窗外的霓虹照在你脸上,你已经连续加了十二天班。",
  choices: [
    { label: "追问期权落到纸面", next: (s) => ({
        text: (s) => "你直视他:“张总,期权我信您。能不能签个协议,把行权价和数量写清楚?也好让我安心干。”他脸上的笑顿了顿。",
        choices: [
          { label: "态度强硬,要白纸黑字", effect: (s) => {
              add(s, "stress", 5);
              if (rnd(jobx_negoRate(s, 0.3))) { add(s, "assets", 20000); add(s, "strategy", 3); flag(s, "got_equity"); return "他打量了你几秒,反而欣赏:“行,有脑子。”三天后协议真送到了你桌上。饼,被你逼成了实打实的东西。"; }
              flag(s, "job_disillusion"); add(s, "reputation", -2); return "他打起哈哈:“都是兄弟,搞这些多见外。”你瞬间懂了——这张饼,从来就没打算烤熟。"; } },
          { label: "笑着接下,先扛着看", effect: (s) => { add(s, "stress", 6); add(s, "health", -4); add(s, "insight", 2); return "你把质疑咽了回去,笑着接下活。深夜回家的地铁上,你盯着黑漆漆的车窗,第一次认真想:这饼,我还要陪他画多久?"; } }
        ]
      }) },
    { label: "果断递辞呈,不画饼了", effect: (s) => { add(s, "mood", 6); add(s, "stress", -6); add(s, "cash", -8000); flag(s, "job_disillusion"); return "你第二天就把辞呈拍在桌上。少了份收入,多了份清醒——有些饼,看一眼就该转身走。"; } }
  ]
});

/* ⑤ 裁员 N+1 谈判：HR → 法务 两层 */
EVENTS.push({
  id: "ev_jobx_layoff_nplus1", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 25,
  title: "📉 优化名单上有你",
  text: (s) => { const r = jobx_pickName(); return `周五下午,HR ${r} 把你叫进小会议室,推来一份《协商解除协议》:“公司战略调整,你的岗位被优化了。按 N+1 给补偿,今天签了,工位下周就清。”你的心咯噔一下,随即冷静下来——这笔账,得算清楚。`; },
  choices: [
    { label: "拒绝当场签,先谈赔偿", next: (s) => ({
        text: (s) => "你合上协议:“N+1 的基数是我去年的月均收入吧?年终奖和加班费也得算进去。还有,这属于无过失裁员,流程得合规。”HR 脸色一变,起身去叫了法务。",
        choices: [
          { label: "搬出劳动法硬刚法务", effect: (s) => {
              add(s, "stress", 7);
              if (rnd(jobx_negoRate(s, 0.4) + s.stats.knowledge / 250)) { add(s, "cash", 60000); add(s, "knowledge", 2); add(s, "reputation", 2); return "法务来势汹汹,你却条条引法、句句在理,还提了一句“否则走仲裁”。对方退让:补偿提到 N+3。懂法的离场,体面又值钱。"; }
              add(s, "cash", 22000); add(s, "mood", -3); return "法务咬死模板不松口,拉锯到天黑。你没争到更多,但好歹按足额 N+1 拿到了赔偿,没被糊弄过去。"; } },
          { label: "见好就收,争个过渡期", effect: (s) => {
              add(s, "cash", 30000); add(s, "network", 3); add(s, "insight", 2);
              return "你换了打法:“补偿按 N+1,但请保留我一个月在职找下家,社保别断。”法务松了口。钱不是最多,胜在体面落地。"; } }
        ]
      }) },
    { label: "签字走人,不想纠缠", effect: (s) => { add(s, "cash", 15000); add(s, "mood", -5); flag(s, "got_laid_off"); return "你签了字,拿了 N+1,当天就收拾了纸箱。走出大楼那一刻阳光刺眼,你忽然不知道明天该去哪里打卡。"; } }
  ]
});

/* ⑥ 办公室政治：被抢功 / 替人背锅 */
EVENTS.push({
  id: "ev_jobx_stolen_credit", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 25,
  title: "🎭 功劳是谁的",
  text: (s) => { const r = jobx_pickName(); return `周会上,${r}正眉飞色舞地汇报那个项目——可那是你熬了三个通宵做出来的方案,他只在最后改了两页 PPT。老板频频点头:“这个做得好!”全场目光都在他身上,没人看你一眼。`; },
  choices: [
    { label: "当场补一句还原真相", next: (s) => ({
        text: (s) => "你不慌不忙开口:“补充一点,核心算法和数据模型上周就跑通了,我把过程文档发群里大家可以看。”会议室空气微妙地凝固,老板的目光在你俩之间来回扫。",
        choices: [
          { label: "拿出时间戳和提交记录", effect: (s) => {
              add(s, "stress", 4);
              if (rnd(jobx_negoRate(s, 0.45))) { add(s, "reputation", 5); add(s, "network", 3); socialShift(s, 3); return "你淡淡甩出 Git 提交记录和文档时间戳,白纸黑字。老板脸色一沉,看了对方一眼。从此谁是干活的,大家心里都有数。"; }
              add(s, "reputation", -2); add(s, "mood", -3); return "你证据确凿,可老板和稀泥:“都是团队功劳嘛。”对手讪讪一笑。你赢了道理,输了那口气。"; } },
          { label: "点到为止,会后再找老板", effect: (s) => {
              add(s, "insight", 2); add(s, "strategy", 2);
              if (rnd(jobx_negoRate(s, 0.4))) { add(s, "reputation", 3); add(s, "network", 2); return "你没把场面闹僵,会后单独找老板复盘了全程。老板心里有了数:“我知道了,这事你受委屈了。”绵里藏针,反而更稳。"; }
              add(s, "mood", -2); return "你会后找老板,他打了个哈哈就把话题岔开。你这才明白,有些老板,是真的不想知道真相。"; } }
        ]
      }) },
    { label: "忍下来,默默记账", effect: (s) => { add(s, "mood", -5); add(s, "stress", 4); add(s, "insight", 2); flag(s, "office_grudge"); return "你把抢功的脸记在了心里,面上不动声色。职场教会你的第一课:笑容可以是面具,账本要藏在心里。"; } }
  ]
});

/* ⑦ 替人背锅：站队抉择 */
EVENTS.push({
  id: "ev_jobx_scapegoat", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 26,
  title: "🔥 这锅要不要背",
  text: (s) => { const r = jobx_pickName(); return `线上出了重大事故,排查下来是直属领导${r}拍板砍了测试环节。复盘会前,他私下把你拉到楼梯间:“兄弟,先把责任揽过去,事后我一定补偿你,升职加薪我担保。”你看着他急切的脸,心里飞快盘算。`; },
  choices: [
    { label: "拒绝背锅,如实陈述", effect: (s) => {
        add(s, "stress", 6); add(s, "reputation", 3);
        if (rnd(jobx_negoRate(s, 0.5))) { add(s, "network", 3); flag(s, "stood_ground"); return "复盘会上你不卑不亢,只陈述事实、不指名道姓。高层看在眼里:“这小子靠谱。”那位领导从此对你客气了三分——做人有底线,反而立住了。"; }
        socialShift(s, -3); add(s, "mood", -4); return "你说了实话,领导记恨在心。接下来的活越派越脏,你成了他眼中的“刺头”。正直,有时候要付利息。"; } },
    { label: "背了,赌他兑现承诺", effect: (s) => {
        add(s, "reputation", -4); add(s, "stress", 5);
        if (rnd(0.3 + s.stats.insight / 300)) { add(s, "cash", 25000); flag(s, "promoted"); add(s, "network", 4); return "你扛下了处分。三个月后他真兑现了承诺,把你提了上去。这场豪赌,你押对了人——但你知道,这种运气不能赌第二次。"; }
        add(s, "mood", -8); flag(s, "job_disillusion"); return "你背了锅,处分进了档案。可没过多久那位领导高升调走,补偿的事再没人提。你才懂:楼梯间的承诺,从来不签字。"; } }
  ]
});

/* ⑧ 副业被发现 / 副业转正 */
EVENTS.push({
  id: "ev_jobx_sidehustle", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 24,
  title: "💸 副业东窗事发",
  text: (s) => "你下班后偷偷做的自媒体账号火了,单月广告分成快赶上半个月工资。可今天老板把你叫进办公室,屏幕上正是你那个账号:“听说这是你做的?公司有规定,不得从事第二职业。”你后背一凉。",
  choices: [
    { label: "坦白并争取合规继续", next: (s) => ({
        text: (s) => "你深吸一口气:“是我做的,纯下班时间,没占用任何公司资源,也不涉及业务竞争。如果有顾虑,我可以签个利益冲突声明。”老板靠回椅背,沉吟着。",
        choices: [
          { label: "提议给公司导流做交换", effect: (s) => {
              add(s, "stress", 4);
              if (rnd(jobx_negoRate(s, 0.4) + s.stats.charm / 250)) { add(s, "cash", 30000); add(s, "network", 4); flag(s, "side_legit"); return "你顺势提议帮公司账号引流。老板眼睛一亮:“那感情好,正缺个懂流量的。”副业不仅保住,还成了你在公司的隐形筹码。"; }
              add(s, "mood", -3); return "老板还是摇头:“规定就是规定。”你只能承诺收敛。副业被按了暂停键,但至少没丢工作。"; } },
          { label: "干脆谈副业转正", effect: (s) => {
              if (rnd(0.25 + s.stats.strategy / 250)) { add(s, "cash", 50000); add(s, "assets", 10000); flag(s, "side_legit"); add(s, "mood", 6); return "你索性摊牌:“与其禁,不如让公司入股一起做。”老板被你说动,谈成了合作分成。一场危机,被你谈成了第二曲线。"; }
              add(s, "stress", 5); add(s, "insight", 2); return "你的提议太超前,老板没接招:“想法不错,但公司不做这块。”转正没谈成,你却看清了自己该往哪走。"; } }
        ]
      }) },
    { label: "立刻关停,保住主业", effect: (s) => { add(s, "cash", -10000); add(s, "mood", -5); add(s, "stress", 3); return "你当场承诺关停账号。回到工位,你删掉那个攒了大半年的号,像亲手熄灭一团刚烧旺的火。安稳的代价,是按下熄火键。"; } }
  ]
});

/* ⑨ 35 岁中年职场危机 */
EVENTS.push({
  id: "ev_jobx_midage_crisis", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 34 && s.age <= 42,
  title: "⏳ 三十五岁这道坎",
  text: (s) => "体检报告上多了两个箭头,孩子的兴趣班催着交费,新来的应届生比你能熬夜、要价还低。今早的会上,90 后的新主管对着你的方案说:“这思路是不是有点旧了?”你盯着电脑屏幕,第一次感到一种被时代往后推的眩晕。",
  choices: [
    { label: "硬扛,卷出一条血路", next: (s) => ({
        text: (s) => "你咬牙报了门新技术的网课,把睡眠又压缩了一小时,试图证明自己没掉队。三个月后,有个攻坚项目实在没人敢接。",
        choices: [
          { label: "主动请缨,赌一把翻身", effect: (s) => {
              add(s, "stress", 8); add(s, "health", -6);
              if (rnd(jobx_negoRate(s, 0.4) + s.stats.knowledge / 250)) { add(s, "cash", 35000); add(s, "reputation", 5); flag(s, "promoted"); return "你扛下硬骨头,带着新学的本事打了个翻身仗。老板刮目相看:“姜还是老的辣。”这一仗,把“中年”二字暂时按了下去。"; }
              add(s, "health", -5); add(s, "mood", -5); return "项目太硬,你拼到住院。结果不算差,身体却拉了警报。你躺在病床上想:用命换的位子,真的值吗?"; } },
          { label: "稳住基本盘,带带新人", effect: (s) => {
              add(s, "network", 4); add(s, "insight", 3); add(s, "mood", 3);
              return "你不再硬卷,转而把经验变成不可替代:带新人、控全局、当团队的定海神针。卷不动了,那就卷别人卷不动的东西。"; } }
        ]
      }) },
    { label: "认清现实,转身求平衡", effect: (s) => {
        add(s, "health", 6); add(s, "mood", 5); add(s, "stress", -6); add(s, "cash", -5000);
        return "你把那门没人逼你上的网课退了,准点下班去接孩子。升职的天花板就在头顶,你索性低下头,先把身体和家庭这两笔账还清。"; } }
  ]
});

/* ⑩ 带新人 / 师徒 */
EVENTS.push({
  id: "ev_jobx_mentor", module: "career", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 28,
  title: "🧑‍🏫 带新人的分寸",
  text: (s) => { const r = jobx_pickName(); return `老板把刚毕业的${r}交给你带:“好好教,这是给你压担子。”可没几天你就发现,这孩子学东西快,提的问题甚至点到了你都没吃透的地方。你心里有点复杂——教会徒弟,会不会饿死师傅?`; },
  choices: [
    { label: "倾囊相授,放手让他飞", next: (s) => ({
        text: (s) => "你索性把压箱底的经验全抖了出来,还把他推到老板面前露脸。几个月后,他独当一面,逢人就说“多亏师父”。",
        choices: [
          { label: "顺势组建自己的小团队", effect: (s) => {
              add(s, "network", 5); add(s, "strategy", 2);
              if (rnd(jobx_negoRate(s, 0.45))) { add(s, "cash", 28000); add(s, "reputation", 4); flag(s, "promoted"); return "你带出的人成了你的左膀右臂,老板顺势让你牵头组队。带人带出了威望——原来教会徒弟,饿不死师傅,还能当上师傅的师傅。"; }
              add(s, "reputation", 3); return "你身边渐渐聚起一群信得过的人。虽然没立刻升职,但人脉这东西,是会在某个关键时刻替你说话的。"; } },
          { label: "只图个好名声,不争权", effect: (s) => { add(s, "mood", 4); add(s, "insight", 2); add(s, "network", 3); return "你不图回报,只图心安。新人念你的好,同事敬你大方。有些回报不进工资卡,却让你在这行走得更稳更远。"; } }
        ]
      }) },
    { label: "留一手,防着被取代", effect: (s) => {
        add(s, "stress", 4);
        if (rnd(0.4)) { add(s, "mood", -3); add(s, "reputation", -2); return "你教得藏着掖着,新人很快察觉,背地里嘀咕你“格局小”。防是防住了,可你也把自己活成了那个你曾经讨厌的老油条。"; }
        add(s, "insight", 1); return "你留了几手关键的活没教,暂时保住了不可替代性。只是夜深时偶尔会想:靠藏着活下去的本事,究竟能撑多久?"; } }
  ]
});

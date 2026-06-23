"use strict";
/* content/news-policy.js —— 手机新闻流扩展：国际新闻、国家政策导向、监管口径。
   通过 newsArticles.push 接入；from/to 控制年份，kind 控制新闻标签。 */

newsArticles.push(
  // 政策导向：房地产 / 城市化 / 基建
  { from: 1998, to: 2007, kind: "policy", wind: "房地产", signal: true, source: "政策简报", headline: "住房商品化继续推进，按揭贷款走进普通家庭", body: "从福利分房到个人按揭，房子正在从单位福利变成家庭资产。银行、开发商、中介和装修队一起热闹起来，围绕居住的生意越来越厚。" },
  { from: 2003, to: 2012, kind: "policy", wind: "房地产", signal: true, source: "城建观察", headline: "多地新区、地铁和产业园密集开工", body: "城市边界被一圈圈推开，地铁口、学区、产业园成为售楼处最会讲的三个词。基建一落地，土地、人口和现金流就跟着动。" },
  { from: 2008, to: 2011, kind: "policy", signal: false, source: "宏观快讯", headline: "刺激计划落地，基建订单迅速升温", body: "钢筋、水泥、工程机械订单抬头，市场情绪被政策托了一把。有人说这是救命钱，也有人担心地方债和房价又要被推高。" },

  // 政策导向：电商 / 移动互联网 / 平台监管
  { from: 2009, to: 2014, kind: "policy", wind: "电商", signal: true, source: "商务部动态", headline: "电子商务示范城市扩围，快递和网店被写进扶持文件", body: "过去被当成小打小闹的网店，开始进入正式政策视野。仓储、支付、快递、客服，围绕线上交易的基础设施正在补齐。" },
  { from: 2014, to: 2018, kind: "policy", wind: "移动互联网", signal: true, source: "数字经济周报", headline: "移动支付、互联网+、智慧城市成为地方招商关键词", body: "政务大厅、公交地铁、小商户都开始接入手机支付。创业者发现，App 不只是年轻人的玩具，也能钻进公共服务和传统行业。" },
  { from: 2020, to: 2023, kind: "regulation", signal: false, source: "监管速递", headline: "平台经济反垄断持续推进，巨头扩张踩刹车", body: "资本开始重新计算平台公司的边界。过去只要烧钱扩张就能讲故事，现在还得回答数据、合规、商户权益和劳动者保障。" },
  { from: 2021, to: 2023, kind: "regulation", signal: false, source: "教育产业观察", headline: "教培行业急刹车，广告、获客、老师招聘全线收缩", body: "曾经最会投流的赛道突然安静下来。创业者看懂了一件事：政策口径一变，再漂亮的增长曲线也可能变成废纸。" },

  // 政策导向：新能源 / 双碳 / 国产替代
  { from: 2020, to: 2028, kind: "policy", wind: "新能源", signal: true, source: "产业政策简报", headline: "双碳目标持续推进，储能、光伏、充电桩被反复点名", body: "文件里的词越来越具体：源网荷储、峰谷电价、绿色工厂。懂政策的人知道，补贴不一定长久，但基础设施一旦铺开，生意会跟着生根。" },
  { from: 2021, to: 2027, kind: "policy", wind: "新能源", signal: true, source: "地方招商通", headline: "多地抢新能源产业链项目，电池厂拿地像抢座", body: "园区给地、给税、给人才公寓，恨不得把整条电池链搬进来。上游材料、设备维护、回收利用，都开始冒出新公司。" },
  { from: 2019, to: 2030, kind: "policy", signal: true, wind: "AI大模型", source: "科技自立观察", headline: "关键技术国产替代提速，算力、芯片和基础软件被反复强调", body: "进口依赖变成商业风险，国产替代从口号变成订单。真正的机会不只在大模型表面，也在算力调度、数据库、中间件和工具链。" },

  // 政策导向：AI / 数据 / 算力 / 机器人
  { from: 2023, to: 2030, kind: "policy", wind: "AI大模型", signal: true, source: "政策风向", headline: "人工智能被列入重点产业，算力券和数据要素试点扩围", body: "各地开始发算力券、建智算中心、推公共数据开放。创业者闻到的不是“AI 很热”，而是政府和产业都在给基础设施加柴。" },
  { from: 2023, to: 2030, kind: "regulation", wind: "AI大模型", signal: true, source: "监管速递", headline: "生成式 AI 备案、数据合规和内容安全成为新门槛", body: "野路子套壳越来越难，能跑通备案、数据授权、模型安全和行业落地的团队开始显得稀缺。合规本身，也变成护城河。" },
  { from: 2027, to: 2035, kind: "policy", wind: "具身智能", signal: true, source: "智能制造简报", headline: "机器人进工厂、进养老、进危险作业场景，试点名单公布", body: "政策不再只讲机器人概念，而是列出具体场景：巡检、搬运、康养、应急救援。谁能把硬件、算法和现场服务打通，谁就有活路。" },
  { from: 2028, to: 2036, kind: "international", wind: "具身智能", signal: true, source: "国际科技线", headline: "多国争抢机器人供应链，核心传感器价格波动", body: "人形机器人不是一个产品，是一串供应链：关节、电机、传感器、模型、工厂数据。国际竞争越激烈，国产替代和本地服务反而越有价值。" },

  // 国际新闻：战争、能源、航运、制裁
  { from: 2022, to: 2026, kind: "international", signal: false, source: "国际频道", headline: "欧洲战争拖长，能源、粮食和化肥价格继续震荡", body: "炮火离你很远，但天然气、电价、粮价和化肥会绕一圈回到成本表上。做硬件、外贸、餐饮和农业相关生意的人，最近都睡得不踏实。" },
  { from: 2023, to: 2026, kind: "international", signal: false, source: "航运日报", headline: "红海航线风险升高，多家船公司改道绕行", body: "运费涨了，交期长了，客户却还是按合同催货。全球化的脆弱，有时就写在一条被迫绕远的航线上。" },
  { from: 2019, to: 2032, kind: "international", signal: false, source: "全球科技报", headline: "出口管制继续加码，芯片、云服务、EDA 成为敏感词", body: "一个海外依赖突然涨价、停供或被限制，就足够让创业团队连夜改架构。地缘政治不在产品需求文档里，却常常决定产品能不能交付。" },
  { from: 2020, to: 2030, kind: "international", signal: false, source: "跨境电商观察", headline: "海外平台规则频繁调整，卖家账号一夜被冻结", body: "物流、税务、知识产权、平台风控一起收紧。出海不是把国内玩法翻译一遍，而是每天和陌生规则打架。" },

  // 国家政策：安全、反诈、数据
  { from: 2016, to: 2035, kind: "policy", signal: false, source: "反诈中心", headline: "电信网络诈骗高发，支付、实名和风控规则继续收紧", body: "骗子更像客服，洗钱更像兼职，平台风控也越来越严。做支付、社交、招聘、出海的人都要面对同一个问题：如何证明你不是坏人。" },
  { from: 2021, to: 2035, kind: "regulation", signal: true, wind: "AI大模型", source: "数据要素观察", headline: "数据安全和个人信息保护执法趋严，企业开始补课", body: "过去随手采集、随便调用的数据，现在都要问一句“有没有授权”。隐私计算、数据治理、企业合规工具，开始从成本项变成刚需。" },
  { from: 2022, to: 2035, kind: "policy", signal: true, wind: "AI大模型", source: "政企数字化周刊", headline: "政企数字化预算向 AI、信创和安全倾斜", body: "客户不再只买一个漂亮后台，而是要国产化适配、权限审计、模型接入和安全责任。ToB 生意慢，但一旦进了预算，粘性也更强。" },

  // 未来政策/国际
  { from: 2032, to: 2042, kind: "policy", wind: "聚变能源", signal: true, source: "能源政策简报", headline: "聚变示范电站纳入国家能源规划，电网改造提速", body: "聚变不再只是实验室新闻，而是写进电网、园区和高耗能产业布局。便宜稳定的电，会重新洗牌数据中心、材料和制造业。" },
  { from: 2038, to: 2050, kind: "policy", wind: "银发经济", signal: true, source: "民政产业观察", headline: "长期护理保险扩围，社区养老和康复设备采购放量", body: "老龄化终于从人口图表变成真金白银的预算。护理、康复、陪诊、适老化改造，不再只是孝心生意，也是制度生意。" },
  { from: 2045, to: 2055, kind: "regulation", wind: "脑机接口", signal: true, source: "伦理监管快讯", headline: "脑机接口临床准入细则发布，医疗级设备先行", body: "消费级脑机故事讲得再热闹，真正能落地的先是康复、神经疾病和辅助沟通。监管画了边界，也给合规团队画出市场。" },
  { from: 2052, to: 2065, kind: "international", wind: "太空经济", signal: true, source: "星际政策线", headline: "近地轨道资源规则谈判升温，卫星频段和轨道位成稀缺资产", body: "太空经济不是浪漫，是牌照、保险、发射窗口和国际规则。谁能理解规则，谁才有资格在头顶那片市场里赚钱。" }
);

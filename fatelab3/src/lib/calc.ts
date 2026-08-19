// @ts-ignore
import { Solar } from 'lunar-typescript';

// ─── 基础常量 ───
export const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
export const LIU_SHEN = ['大安','留连','速喜','赤口','小吉','空亡'];

const WU_XING_GAN = ['木','木','火','火','土','土','金','金','水','水'];
const WU_XING_ZHI = ['水','土','木','木','土','火','火','土','金','金','土','水'];
const WU_XING_CN = ['木','火','土','金','水'];

// 五虎遁：年干 → 正月(寅月)天干索引
const WU_HU_DUN: Record<number, number> = {
  0: 2, 5: 2, // 甲己 → 丙
  1: 4, 6: 4, // 乙庚 → 戊
  2: 6, 7: 6, // 丙辛 → 庚
  3: 8, 8: 8, // 丁壬 → 壬
  4: 0, 9: 0, // 戊癸 → 甲
};

// 五鼠遁：日干 → 子时天干索引
const WU_SHU_DUN: Record<number, number> = {
  0: 0, 5: 0, // 甲己 → 甲
  1: 2, 6: 2, // 乙庚 → 丙
  2: 4, 7: 4, // 丙辛 → 戊
  3: 6, 8: 6, // 丁壬 → 庚
  4: 8, 9: 8, // 戊癸 → 壬
};

const SHI_CHEN_NAMES = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];

const YI_POOL = [
  ['祭祀','祈福','求嗣','开光','出行','解除','伐木','出火','入宅','移徙','纳畜'],
  ['嫁娶','纳采','订盟','安床','修造','动土','起基','定磉','造庙','造船'],
  ['交易','立券','纳财','开市','挂匾','栽种','作灶','纳采','订盟','嫁娶'],
  ['裁衣','冠笄','安香','入学','开仓','求医','治病','扫舍','破土','安葬'],
  ['会亲友','赴任','见贵','求财','入学','上任','结婚','订婚','搬家','开业'],
];
const JI_POOL = [
  ['词讼','安葬','修坟','探病','作梁','掘井','开池','破屋','坏垣','余事勿取'],
  ['开仓','出货财','置产','行丧','词讼','安床','破土','伐木','作梁','造船'],
  ['入宅','移徙','赴任','安葬','破土','启钻','词讼','掘井','开池','作灶'],
  ['纳采','订盟','嫁娶','开市','出行','修造','动土','栽种','经络','开光'],
  ['求医','针刺','针灸','诉讼','赌博','远行','签约','借贷','担保','合伙'],
];

const ZODIAC_SIGNS: ZodiacSignDef[] = [
  { sign:'摩羯座', name:'摩羯座', emoji:'♑', start:[12,22], end:[1,19], desc:'务实、坚韧、有耐心，追求事业和安全感。', fortune:{overall:78, career:82, wealth:75, love:70, health:76, emotion:72, interpersonal:74, text:'今日适合稳步推进长期计划，工作上有贵人相助。财运平稳，注意控制开支。感情上多关心对方，避免冷淡。'} },
  { sign:'水瓶座', name:'水瓶座', emoji:'♒', start:[1,20], end:[2,18], desc:'独立、创新、人道主义，思维超前。', fortune:{overall:85, career:80, wealth:72, love:78, health:80, emotion:82, interpersonal:88, text:'今日灵感爆棚，适合创意工作和社交活动。财运有意外机会。感情上沟通顺畅。'} },
  { sign:'双鱼座', name:'双鱼座', emoji:'♓', start:[2,19], end:[3,20], desc:'敏感、浪漫、富有同情心，直觉强。', fortune:{overall:70, career:68, wealth:65, love:82, health:72, emotion:85, interpersonal:75, text:'今日直觉敏锐，适合艺术和灵感工作。注意不要过度消费。感情运势佳，单身者有机会。'} },
  { sign:'白羊座', name:'白羊座', emoji:'♈', start:[3,21], end:[4,19], desc:'热情、勇敢、行动力强，充满冲劲。', fortune:{overall:80, career:85, wealth:76, love:74, health:82, emotion:78, interpersonal:72, text:'今日精力充沛，适合推进重要项目。注意控制脾气。财运不错，但避免冲动消费。'} },
  { sign:'金牛座', name:'金牛座', emoji:'♉', start:[4,20], end:[5,20], desc:'稳重、踏实、重视物质享受，耐力十足。', fortune:{overall:76, career:78, wealth:85, love:72, health:74, emotion:70, interpersonal:76, text:'今日财运上升，适合理财规划。工作上稳扎稳打有回报。注意饮食健康。'} },
  { sign:'双子座', name:'双子座', emoji:'♊', start:[5,21], end:[6,20], desc:'聪明、灵活、善于沟通，好奇心强。', fortune:{overall:82, career:80, wealth:74, love:80, health:76, emotion:84, interpersonal:86, text:'今日思维活跃，适合学习和交流。社交运势极佳。注意专注力分散的问题。'} },
  { sign:'巨蟹座', name:'巨蟹座', emoji:'♋', start:[6,21], end:[7,22], desc:'温柔、顾家、情感丰富，重视安全感。', fortune:{overall:74, career:72, wealth:76, love:85, health:78, emotion:80, interpersonal:72, text:'今日家庭运势佳，适合陪伴家人。工作上宜保守。财运平稳，注意储蓄。'} },
  { sign:'狮子座', name:'狮子座', emoji:'♌', start:[7,23], end:[8,22], desc:'自信、大方、领导气质，热爱表现。', fortune:{overall:84, career:88, wealth:78, love:82, health:80, emotion:82, interpersonal:86, text:'今日气场强大，适合展示自我和领导团队。有贵人运。感情上魅力十足。'} },
  { sign:'处女座', name:'处女座', emoji:'♍', start:[8,23], end:[9,22], desc:'细致、完美主义、分析力强，务实可靠。', fortune:{overall:78, career:82, wealth:80, love:72, health:84, emotion:76, interpersonal:74, text:'今日适合整理和规划，工作效率极高。注意不要过度挑剔。健康运势佳。'} },
  { sign:'天秤座', name:'天秤座', emoji:'♎', start:[9,23], end:[10,22], desc:'优雅、公正、善于社交，追求平衡和谐。', fortune:{overall:80, career:76, wealth:74, love:85, health:78, emotion:80, interpersonal:88, text:'今日人际关系和谐，合作顺利。感情运势极佳。财运平稳，适合审美相关消费。'} },
  { sign:'天蝎座', name:'天蝎座', emoji:'♏', start:[10,23], end:[11,21], desc:'深沉、洞察力强、意志坚定，富有魅力。', fortune:{overall:76, career:80, wealth:82, love:78, health:74, emotion:82, interpersonal:68, text:'今日洞察力敏锐，适合深入研究和投资。注意不要过于猜疑。财运有意外收获。'} },
  { sign:'射手座', name:'射手座', emoji:'♐', start:[11,22], end:[12,21], desc:'乐观、自由、冒险精神，追求真理。', fortune:{overall:82, career:78, wealth:76, love:80, health:84, emotion:86, interpersonal:82, text:'今日适合出行和学习，运势开阔。注意不要过度乐观。健康运佳，适合运动。'} },
];

export interface BaziResult {
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourGanZhi: string;
  dayMaster: string;
  dayMasterWuxing: string;
  wuxing: Record<string, number>;
  xiYongShen: string;
}

export interface HuangliResult {
  yi: string[];
  ji: string[];
  wuxing: string;
  chong: string;
  sha: string;
}

export interface XiaoliurenResult {
  name: string;
  desc: string;
  fortune: string;
}

export interface ZodiacResult {
  sign: string;
  name: string;       // 显示名称（与sign相同）
  emoji: string;
  start: number[];    // [月, 日]
  end: number[];      // [月, 日]
  desc: string;
  fortune: {
    overall: number;
    career: number;
    wealth: number;
    love: number;
    health: number;
    emotion: number;
    interpersonal: number;
    text: string;
  };
}

interface ZodiacSignDef extends ZodiacResult {
  name: string;
  start: [number, number];
  end: [number, number];
}

export interface FortuneResults {
  bazi: BaziResult;
  huangli: HuangliResult;
  xiaoliuren: XiaoliurenResult;
  zodiac: ZodiacResult;
}

// ─── 核心算法 ───

function getYearGanZhi(year: number): [number, number] {
  const offset = (year - 4) % 60;
  return [offset % 10, offset % 12];
}

function getMonthGanZhi(year: number, month: number): [number, number] {
  const [yearGan] = getYearGanZhi(year);
  const startGan = WU_HU_DUN[yearGan] ?? 0;
  const monthGan = (startGan + month - 1) % 10;
  const monthZhi = (month + 1) % 12; // 寅=1月 → 索引2
  return [monthGan, monthZhi];
}

function getDayGanZhi(year: number, month: number, day: number): [number, number] {
  const baseDate = new Date(2000, 0, 1); // 2000-01-01 甲子日 (idx 36, 但简化用0)
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayIndex = ((diffDays % 60) + 60) % 60;
  return [dayIndex % 10, dayIndex % 12];
}

function getHourZhi(hour: number): number {
  if (hour >= 23 || hour < 1) return 0;
  return Math.floor((hour + 1) / 2);
}

function getHourGanZhi(year: number, month: number, day: number, hour: number): [number, number] {
  const [dayGan] = getDayGanZhi(year, month, day);
  const hourZhi = getHourZhi(hour);
  const startGan = WU_SHU_DUN[dayGan] ?? 0;
  const hourGan = (startGan + hourZhi) % 10;
  return [hourGan, hourZhi];
}

function getWuxingCount(bazi: [number, number][]): Record<string, number> {
  const count: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  for (const [gan, zhi] of bazi) {
    count[WU_XING_GAN[gan]] = (count[WU_XING_GAN[gan]] || 0) + 1;
    count[WU_XING_ZHI[zhi]] = (count[WU_XING_ZHI[zhi]] || 0) + 1;
  }
  return count;
}

function getXiYongShen(wuxing: Record<string, number>): string {
  let minWx = '木';
  let minCount = Infinity;
  for (const wx of WU_XING_CN) {
    if ((wuxing[wx] || 0) < minCount) {
      minCount = wuxing[wx] || 0;
      minWx = wx;
    }
  }
  return minWx;
}

function getXiaoliurenDesc(name: string): string {
  const descs: Record<string, { desc: string; fortune: string }> = {
    '大安': { desc: '身不动时，属木，代表稳定、安定。', fortune: '今日诸事顺遂，宜静不宜动，安稳为上。适合做决策和规划。' },
    '留连': { desc: '卒未归时，属水，代表拖延、纠缠。', fortune: '今日事宜缓慢推进，不可急躁。注意拖延事项，耐心处理。' },
    '速喜': { desc: '人即至时，属火，代表快速、喜悦。', fortune: '今日喜事临门，好消息将至。适合主动出击、把握机会。' },
    '赤口': { desc: '官事凶时，属金，代表口舌、争端。', fortune: '今日易有口舌是非，谨言慎行。避免冲动决策和争吵。' },
    '小吉': { desc: '人来喜时，属水，代表小小吉利。', fortune: '今日有小吉之兆，虽无大喜但平安顺遂。适合日常事务。' },
    '空亡': { desc: '音信稀时，属土，代表虚无、落空。', fortune: '今日不宜强求，所谋多虚。宜休息反思，等待时机。' },
  };
  return descs[name]?.desc ?? '';
}

function getXiaoliurenFortune(name: string): string {
  const descs: Record<string, string> = {
    '大安': '今日诸事顺遂，宜静不宜动，安稳为上。适合做决策和规划。',
    '留连': '今日事宜缓慢推进，不可急躁。注意拖延事项，耐心处理。',
    '速喜': '今日喜事临门，好消息将至。适合主动出击、把握机会。',
    '赤口': '今日易有口舌是非，谨言慎行。避免冲动决策和争吵。',
    '小吉': '今日有小吉之兆，虽无大喜但平安顺遂。适合日常事务。',
    '空亡': '今日不宜强求，所谋多虚。宜休息反思，等待时机。',
  };
  return descs[name] ?? '';
}

function getHuangli(dayGanZhiIndex: number): HuangliResult {
  const yiIdx = dayGanZhiIndex % YI_POOL.length;
  const jiIdx = dayGanZhiIndex % JI_POOL.length;
  const [dayGan, dayZhi] = [dayGanZhiIndex % 10, dayGanZhiIndex % 12];
  const wuxing = `${WU_XING_GAN[dayGan]}${WU_XING_ZHI[dayZhi]}`;
  const chongZhi = (dayZhi + 6) % 12;
  const chong = `${DI_ZHI[chongZhi]}（生肖${['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'][chongZhi]}）`;
  const shaDirs = ['北','东北','东','东南','南','西南','西','西北','北','东北','东','东南'];
  const sha = shaDirs[dayZhi];
  return {
    yi: YI_POOL[yiIdx].slice(0, 6),
    ji: JI_POOL[jiIdx].slice(0, 5),
    wuxing,
    chong,
    sha,
  };
}

function getZodiacByDate(month: number, day: number): ZodiacSignDef {
  for (const z of ZODIAC_SIGNS) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (sm < em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return z;
    } else {
      // 跨年：如摩羯 12/22 ~ 1/19
      if ((month === sm && day >= sd) || month > sm || (month === em && day <= ed)) return z;
    }
  }
  return ZODIAC_SIGNS[0]; // fallback
}

// ─── 公开 API ───

export function calcBazi(year: number, month: number, day: number, hour: number): BaziResult {
  // 使用 lunar-typescript 计算，与测测/万年历等主流算命软件一致
  // 月柱按节气换月（非公历月），日柱精确
  const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
  const bz = solar.getLunar().getEightChar();

  const yearGanZhi: string = bz.getYear();
  const monthGanZhi: string = bz.getMonth();
  const dayGanZhi: string = bz.getDay();
  const hourGanZhi: string = bz.getTime();

  // 日主 = 日干
  const dayMaster: string = bz.getDayGan();
  const dayMasterWuxing: string = bz.getDayWuXing().slice(0, 1);

  // 五行统计：从四柱的纳音/藏干汇总（简化：取天干地支各自五行）
  const ganZhiList = [yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi];
  const wuxingCount: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  for (const gz of ganZhiList) {
    const ganIdx = TIAN_GAN.indexOf(gz[0]);
    const zhiIdx = DI_ZHI.indexOf(gz[1]);
    if (ganIdx >= 0) wuxingCount[WU_XING_GAN[ganIdx]] = (wuxingCount[WU_XING_GAN[ganIdx]] || 0) + 1;
    if (zhiIdx >= 0) wuxingCount[WU_XING_ZHI[zhiIdx]] = (wuxingCount[WU_XING_ZHI[zhiIdx]] || 0) + 1;
  }
  const xiYongShen = getXiYongShen(wuxingCount);

  return {
    yearGanZhi,
    monthGanZhi,
    dayGanZhi,
    hourGanZhi,
    dayMaster,
    dayMasterWuxing,
    wuxing: wuxingCount,
    xiYongShen,
  };
}

export function calcHuangli(year: number, month: number, day: number): HuangliResult {
  const baseDate = new Date(2000, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayIndex = ((diffDays % 60) + 60) % 60;
  return getHuangli(dayIndex);
}

export function calcXiaoliuren(month: number, day: number, hour: number): XiaoliurenResult {
  const shiChenIdx = getHourZhi(hour);
  // 月份取农历月简化处理：直接用公历月
  const idx = (month + day + shiChenIdx) % 6;
  const name = LIU_SHEN[idx];
  return {
    name,
    desc: getXiaoliurenDesc(name),
    fortune: getXiaoliurenFortune(name),
  };
}

export function calcZodiac(month: number, day: number): ZodiacResult {
  return getZodiacByDate(month, day);
}

export function calcAllFortune(
  name: string,
  gender: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  birthPlace: string
): FortuneResults {
  return {
    bazi: calcBazi(year, month, day, hour),
    huangli: calcHuangli(year, month, day),
    xiaoliuren: calcXiaoliuren(month, day, hour),
    zodiac: calcZodiac(month, day),
  };
}

/** 获取用于盲测的今日各流派预测文本 */
export function getTodayPredictions(birthMonth: number, birthDay: number, birthHour: number): Record<string, string> {
  const today = new Date();
  const huangli = calcHuangli(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const xiaoliuren = calcXiaoliuren(today.getMonth() + 1, today.getDate(), birthHour);
  const zodiac = calcZodiac(birthMonth, birthDay);
  const bazi = calcBazi(today.getFullYear(), today.getMonth() + 1, today.getDate(), birthHour);

  return {
    bazi: `今日八字日柱为${bazi.dayGanZhi}，日主${bazi.dayMaster}（${bazi.dayMasterWuxing}），五行喜用${bazi.xiYongShen}。整体运势平稳，宜顺势而为。`,
    huangli: `今日宜：${huangli.yi.join('、')}。忌：${huangli.ji.join('、')}。冲${huangli.chong}，煞${huangli.sha}。`,
    xiaoliuren: `小六壬得「${xiaoliuren.name}」。${xiaoliuren.fortune}`,
    zodiac: zodiac.fortune.text,
  };
}

export function getShiChenName(hour: number): string {
  return SHI_CHEN_NAMES[getHourZhi(hour)];
}

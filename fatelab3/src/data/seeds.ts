import type { DataSource, Method, MethodStats, Dimension } from './schema';
import { ALL_METHODS, ALL_DIMENSIONS } from './schema';

// ──── 真实数据源 ────
export const SOURCES: DataSource[] = [
  {
    id: 'weibo_bazi_lunyu',
    name: '微博·八字论语',
    url: 'https://m.weibo.cn/u/1713926127',
    type: 'rss',
    reliability: 0.6,
    description: '微博知名命理博主，每日发布八字运势预测，手工录入可靠性中等',
    lastFetched: null,
  },
  {
    id: 'rsshub_zhihu_zhanxing',
    name: '知乎·占星话题 RSS',
    url: 'https://rsshub.app/zhihu/topic/19554199',
    type: 'rss',
    reliability: 0.5,
    description: '通过 RSSHub 抓取知乎占星话题下的讨论和预测帖，社区内容质量参差不齐',
    lastFetched: null,
  },
  {
    id: 'alapi_huangli',
    name: 'Alapi 黄历 API',
    url: 'https://alapi.cn/api/view/85',
    type: 'api',
    reliability: 0.9,
    description: 'Alapi 提供的黄历/老黄历数据 API，算法抓取，结构化程度高',
    lastFetched: null,
  },
  {
    id: 'juhe_wannianli',
    name: '聚合数据万年历',
    url: 'https://www.juhe.cn/docs/api/id/119',
    type: 'api',
    reliability: 0.9,
    description: '聚合数据万年历 API，包含黄历宜忌、干支纪年等结构化数据',
    lastFetched: null,
  },
  {
    id: 'rsshub_weibo_tarot',
    name: '微博·塔罗占卜 RSS',
    url: 'https://rsshub.app/weibo/user/5691234567',
    type: 'rss',
    reliability: 0.5,
    description: '微博塔罗博主的 RSS 订阅源（示例占位 ID，实际使用时需替换为真实博主 UID）',
    lastFetched: null,
  },
  {
    id: 'manlu_qimen',
    name: '奇门遁甲爱好者论坛',
    url: 'https://www.qmdj.net/',
    type: 'manual',
    reliability: 0.4,
    description: '奇门遁甲爱好者社区，口口相传的预测案例，可靠性偏低',
    lastFetched: null,
  },
  {
    id: 'rsshub_douban_ziwei',
    name: '豆瓣·紫微斗数小组 RSS',
    url: 'https://rsshub.app/douban/group/ziweidoushu',
    type: 'rss',
    reliability: 0.5,
    description: '豆瓣紫微斗数小组讨论 RSS，用户分享的排盘和分析',
    lastFetched: null,
  },
  {
    id: 'app_cece_xiaoliuren',
    name: '测测 App 小六壬',
    url: 'https://www.cece.com/',
    type: 'manual',
    reliability: 0.6,
    description: '主流玄学 App 测测中的小六壬功能，手工抽取预测结果',
    lastFetched: null,
  },
  {
    id: 'rsshub_weibo_meihua',
    name: '微博·梅花易数 RSS',
    url: 'https://rsshub.app/weibo/search/梅花易数',
    type: 'rss',
    reliability: 0.5,
    description: '通过 RSSHub 搜索微博「梅花易数」关键词获取的预测内容',
    lastFetched: null,
  },
  {
    id: 'api_tianqi_huangli',
    name: '天气API黄历接口',
    url: 'https://www.tianqiapi.com/api/?version=huangli',
    type: 'api',
    reliability: 0.85,
    description: '天气API附带的黄历数据接口，包含每日宜忌、冲煞、五行等',
    lastFetched: null,
  },
  {
    id: 'manual_linggan',
    name: '灵机文化 App',
    url: 'https://www.lingji.com/',
    type: 'manual',
    reliability: 0.6,
    description: '灵机文化旗下多款玄学 App，手工录入每日运势预测',
    lastFetched: null,
  },
  {
    id: 'rsshub_bilibili_bazi',
    name: 'B站·八字教学 RSS',
    url: 'https://rsshub.app/bilibili/user/search?keyword=八字命理',
    type: 'rss',
    reliability: 0.4,
    description: 'B站八字命理教学视频弹幕和评论中的预测案例，可信度较低',
    lastFetched: null,
  },
];

// ──── 流派元数据 ────
export interface MethodMeta {
  id: Method;
  name: string;
  color: string;
  description: string;
  theory: string;
  pros: string[];
  cons: string[];
}

export const METHODS: MethodMeta[] = [
  {
    id: 'bazi',
    name: '八字',
    color: '#E74C3C',
    description: '以出生年、月、日、时的天干地支组合推演命运',
    theory: '基于阴阳五行、天干地支体系，认为人出生时的时空能量格局决定了一生命运的基本轮廓。通过十神关系、大运流年推演具体事件。',
    pros: ['体系最为完善', '历史文献丰富', '个性化程度高'],
    cons: ['需要精确出生时间', '不同流派解法差异大', '主观性强'],
  },
  {
    id: 'ziwei',
    name: '紫微斗数',
    color: '#9B59B6',
    description: '以紫微星为首的十四主星排布十二宫位来预测',
    theory: '将天上星曜映射到人命十二宫，通过星曜庙旺落陷、四化飞星来推断运势。号称"帝王之术"。',
    pros: ['宫位系统精细', '可预测具体领域', '排盘工具成熟'],
    cons: ['星曜解释歧义多', '四化规则不统一', '学习曲线陡峭'],
  },
  {
    id: 'astrology',
    name: '占星',
    color: '#3498DB',
    description: '西方占星术，以行星在黄道十二宫的位置推演',
    theory: '基于希腊化时期传承的占星体系，通过本命盘、行运盘、太阳弧等技术分析个人运势和事件趋势。',
    pros: ['国际化程度高', '工具生态丰富', '心理学融合度高'],
    cons: ['文化适配性争议', '宫位制选择分歧', '验证研究结果不一致'],
  },
  {
    id: 'huangli',
    name: '黄历',
    color: '#2ECC71',
    description: '传统历书中的每日宜忌、冲煞、五行信息',
    theory: '基于干支纪日、二十八宿、十二建除等传统历法系统，每日标注宜忌事项，属于群体性通用预测。',
    pros: ['数据来源标准化', '每日更新可验证', '无需个人信息'],
    cons: ['粒度粗泛', '宜忌描述模糊', '缺乏个性化'],
  },
  {
    id: 'xiaoliuren',
    name: '小六壬',
    color: '#F39C12',
    description: '以大安、留连、速喜、赤口、小吉、空亡六神断吉凶',
    theory: '简化版六壬系统，以月日时三参数落宫定六神，快速判断吉凶。适合即时占卜。',
    pros: ['操作极简', '适合日常验证', '结果明确'],
    cons: ['信息量有限', '理论基础薄弱', '适用范围窄'],
  },
  {
    id: 'tarot',
    name: '塔罗',
    color: '#1ABC9C',
    description: '78张塔罗牌占卜，通过牌阵解读趋势',
    theory: '源自中世纪欧洲的牌卜系统，通过22张大阿卡纳和56张小阿卡纳的组合，利用象征主义和直觉解读来预测。',
    pros: ['直觉性强', '问题针对性好', '解读灵活'],
    cons: ['高度主观', '难以标准化', '复现性差'],
  },
  {
    id: 'qimen',
    name: '奇门遁甲',
    color: '#E67E22',
    description: '古代兵阴阳术，以九宫八门九星八神排盘',
    theory: '融合天干地支、九宫八卦、二十八星的复杂系统，最初用于军事决策，后扩展到人生预测。',
    pros: ['体系庞大精细', '时空结合', '历史底蕴深厚'],
    cons: ['极度复杂', '排盘规则分歧', '验证困难'],
  },
  {
    id: 'meihua',
    name: '梅花易数',
    color: '#8E44AD',
    description: '宋代邵雍创立的以象数为基础的占卜体系',
    theory: '以先天八卦数为基础，通过时间、数字、声音等外应起卦，结合体用关系断卦。强调"不动不占"。',
    pros: ['起卦灵活', '理论基础扎实', '适合事件占卜'],
    cons: ['外应选择主观', '象意解读模糊', '需要深厚功底'],
  },
];

// ──── 空统计占位 ────
export function generateEmptyStats(): MethodStats[] {
  const stats: MethodStats[] = [];
  for (const method of ALL_METHODS) {
    for (const dimension of ALL_DIMENSIONS) {
      stats.push({
        method,
        dimension,
        n: 0,
        hitRate: 0,
        pearsonR: null,
        avgPredictedScore: null,
        avgActualScore: null,
        lastUpdated: null,
      });
    }
  }
  return stats;
}

export const EMPTY_STATS = generateEmptyStats();

// ──── 方法论文本 ────
export const METHODOLOGY_TEXT = `# 玄学预测效力验证平台 · 方法论

## 一、平台使命

本平台以循证科学态度，用统计学方法检验各玄学流派的真实预测效力。
我们不做"信不信"的价值判断，只回答"准不准"的数据问题。

## 二、核心假设

- **零假设 H₀**：某流派的预测结果与实际结果之间不存在显著相关性（r ≈ 0）
- **备择假设 H₁**：某流派在特定维度上存在显著正相关（r > 0, p < 0.05）
- 如果某流派在足够多样本下持续无法拒绝 H₀，则该流派在统计学意义上被证伪
- 如果某流派在特定维度上显著拒绝 H₀，则成为可量化的概率辅助工具

## 三、创始人理念

本平台由一名经济学学生发起。核心动机源于一个简单问题：
"如果玄学真的有用，为什么不能像量化金融模型一样被回测和验证？"

受经济学中有效市场假说和双盲实验方法的启发，平台设计了以下验证框架：
1. 从公开来源收集真实预测（不做任何筛选或修改）
2. 由不知晓预测来源的用户回答中性问题（双盲）
3. 用 AI 评分系统自动计算匹配度
4. 用统计学方法汇总分析

## 四、数据口径

### 4.1 纳入标准
- 预测必须在事件发生前发布（禁止"事后诸葛亮"）
- 预测内容必须有明确的时间指向
- 预测必须可被归类到某一维度
- 来源必须可追溯（有 URL 或可验证的出处）

### 4.2 排除标准
- 模糊到无法验证的预测（如"今年可能有些变化"）
- 需要用户事后回忆才能验证的内容
- 来源不明或经过多次转述的内容

## 五、评分体系

### 5.1 命中率（Hit Rate）
最简单直观的指标：预测吉凶等级与实际体验一致的比率。

### 5.2 Pearson 相关系数
将吉凶等级映射为数值（大吉=5, 吉=4, 平=3, 凶=2, 大凶=1），
计算预测得分与实际得分的相关系数。

### 5.3 置信区间
- n ≥ 100：高置信，结果可用于正式比较
- 30 ≤ n < 100：中等置信，结果可作为参考
- 7 ≤ n < 30：低置信，仅标注"参考值"
- n < 7：数据不足，不做结论

## 六、双盲设计

- 用户不知道题目来自哪个流派或哪个来源
- 题目以中性方式呈现，避免玄学术语暗示
- 用户根据自己的真实情况作答
- AI 自动评分，消除人工评分偏差

## 七、透明原则

- 所有原始预测数据公开可查
- 评分算法和统计公式完全开源
- 任何人都可以下载数据独立复现
- 平台不拥有任何预测内容的版权`;

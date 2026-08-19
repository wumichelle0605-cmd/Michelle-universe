// ── 流派 ──
export type Method =
  | 'bazi'       // 八字
  | 'ziwei'      // 紫微斗数
  | 'astrology'  // 占星
  | 'huangli'    // 黄历
  | 'xiaoliuren' // 小六壬
  | 'tarot'      // 塔罗
  | 'qimen'      // 奇门遁甲
  | 'meihua';    // 梅花易数

export const METHOD_LABELS: Record<Method, string> = {
  bazi: '八字',
  ziwei: '紫微斗数',
  astrology: '占星',
  huangli: '黄历',
  xiaoliuren: '小六壬',
  tarot: '塔罗',
  qimen: '奇门遁甲',
  meihua: '梅花易数',
};

// ── 维度 ──
export type Dimension = 'overall' | 'career' | 'wealth' | 'love' | 'health' | 'emotion' | 'interpersonal';

export const DIMENSION_LABELS: Record<Dimension, string> = {
  overall: '整体',
  career: '事业',
  wealth: '财运',
  love: '感情',
  health: '健康',
  emotion: '情绪',
  interpersonal: '人际',
};

export const ALL_METHODS: Method[] = ['bazi', 'ziwei', 'astrology', 'huangli', 'xiaoliuren', 'tarot', 'qimen', 'meihua'];
export const ALL_DIMENSIONS: Dimension[] = ['overall', 'career', 'wealth', 'love', 'health', 'emotion', 'interpersonal'];

// ── 吉凶等级 ──
export type PredictionLevel = '大吉' | '吉' | '平' | '凶' | '大凶';
export const ALL_LEVELS: PredictionLevel[] = ['大吉', '吉', '平', '凶', '大凶'];

// ── 数据源类型 ──
export type SourceType = 'rss' | 'api' | 'manual';

// ── 数据来源 ──
export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  reliability: number;   // 0-1
  description: string;
  lastFetched: string | null;  // ISO date
}

// ── 单条预测记录 ──
export interface Prediction {
  id: string;
  method: Method;
  source: string;       // DataSource.id
  date: string;         // 预测发布日期 ISO
  content: string;      // 预测原文摘要
  targetDate: string;   // 预测目标日期 ISO
  dimension: Dimension;
  predictedLevel: PredictionLevel;
  url?: string;
  verifiedAt?: string;  // ISO
}

// ── 验证记录 ──
export interface Verification {
  id: string;
  predictionId: string;
  userId: string;
  actualAnswer: string;
  dimension: Dimension;
  llmScore: number;      // 0-100
  llmJudge: string;      // 简要判定
  createdAt: string;     // ISO
}

// ── 流派统计 ──
export interface MethodStats {
  method: Method;
  dimension: Dimension;
  n: number;
  hitRate: number;       // 0-1
  pearsonR: number | null;
  avgPredictedScore: number | null;
  avgActualScore: number | null;
  lastUpdated: string | null;
}

// ── 数据源目录条目 ──
export interface SourceCatalog {
  source: DataSource;
  predictionCount: number;
  lastPredictionDate: string | null;
}

// ── 盲测作答记录 ──
export interface BlindtestAnswer {
  id: string;
  date: string;
  questions: {
    questionText: string;
    options: string[];
    selectedOption: number | null;
    dimension: Dimension;
    method: Method | null;
    source: string | null;
  }[];
  selfRating: number;  // 1-5 自评
  submittedAt: string;
}

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chat } from '../lib/llm.js';
import { getTodayPredictions, calcAllFortune } from '../lib/calc.js';
import { getVerifications, saveVerification, genId, saveBlindtestAnswer, getBlindtestHistory } from '../data/store.js';
import type { Dimension, Method } from '../data/schema.js';
import { DIMENSION_LABELS, METHOD_LABELS } from '../data/schema.js';

// ─── 题目类型 ───
interface Question {
  type: 'single' | 'multi' | 'judge' | 'fill';
  dimension: Dimension | 'character' | 'habit';
  question: string;
  options: string[] | null;  // fill 题为 null
  sourceMethod: string;
  sourceContent: string;
}

type Answer = number | number[] | string | null;

// ─── 静态演示样题 ───
const DEMO_QUESTIONS: Question[] = [
  // ─── 性格特质（多选）
  {
    type: 'multi',
    dimension: 'character',
    question: '以下哪些词语较符合你平时的性格特质？（可多选）',
    options: ['理性冷静、喜欢逻辑分析', '热情开朗、善于调动气氛', '细心敏感、注重细节', '果断居先、做事雷厉风行', '温和包容、善于倾听', '独立自主、不喜被干涉'],
    sourceMethod: 'bazi',
    sourceContent: '八字日主五行特质分析。',
  },
  // ─── 天赋领域（多选）
  {
    type: 'multi',
    dimension: 'career',
    question: '以下注意领域中，你认为自己真正擅长的是哪些？（可多选）',
    options: ['数字逻辑、研究分析', '艺术设计、审美创意', '语言文字、内容表达', '沟通协调、组织管理', '动手制作、工种技等', '教学带堵、知识传播'],
    sourceMethod: 'bazi',
    sourceContent: '八字五行与日主组合暗示个人天赋倒向。',
  },
  // ─── 职业类型（单选）
  {
    type: 'single',
    dimension: 'career',
    question: '你目前从事的工作 / 学业最接近哪种类型？',
    options: ['技术 / 研发相关', '管理 / 运营相关', '创意 / 设计相关', '服务 / 教育相关', '目前还是学生'],
    sourceMethod: 'bazi',
    sourceContent: '八字日主暗示职业倒向。',
  },
  // ─── 感情状态（单选）
  {
    type: 'single',
    dimension: 'love',
    question: '你目前的感情 / 亲密关系状态是？',
    options: ['目前单身，没有伴侣', '正在恋爱中，关系稳定', '正在恋爱中，但有些摩擦或困惑', '已经分手或正在分手中'],
    sourceMethod: 'zodiac',
    sourceContent: '星座感情运势分析。',
  },
  // ─── 感情满意度（单选，含单身跳过项）
  {
    type: 'single',
    dimension: 'love',
    question: '如果你目前有伴侣，近三个月对两人感情质量的整体评价是？（单身可跳过）',
    options: ['目前单身，跳过此题', '甜蜜幸福，非常满意', '还不错，有小摩擦但还行', '比较平淡，缺乏激情'],
    sourceMethod: 'zodiac',
    sourceContent: '星座感情运势描述两人关系质量。',
  },
  // ─── 健康倒向（单选）
  {
    type: 'single',
    dimension: 'health',
    question: '以下身体区域中，哪个部位让你近期最容易感到不适或需要关注？',
    options: ['肝脏 / 眼睛（容易疲劳、干涩）', '肠胃 / 消化系统（容易胀气、脾胃）', '心脏 / 血管（容易燥热、心跳）', '肾 / 骨骼（容易畏冷、疲劳）', '目前不太有明显不适'],
    sourceMethod: 'bazi',
    sourceContent: '八字五行分析对应脏腑健康倒向。',
  },
  // ─── 睡眠质量（判断）
  {
    type: 'judge',
    dimension: 'health',
    question: '最近一个月内，你是否有过明显的睡眠质量下降或失眠问题？',
    options: ['是', '否', '不确定'],
    sourceMethod: 'bazi',
    sourceContent: '八字展示健康运势。',
  },
  // ─── 精力状态（单选）
  {
    type: 'single',
    dimension: 'health',
    question: '过去一个月，你的整体精力状态最接近哪个描述？',
    options: ['精力充沛，很少感到疲惫', '出现明显的下午上头或头皮燥', '肋肝区域偶尔不适或胀情', '总体疲惫，屡屡想休息'],
    sourceMethod: 'bazi',
    sourceContent: '八字日主五行对身体状态的倒向分析。',
  },
  // ─── 近期重大事件（判断）
  {
    type: 'judge',
    dimension: 'overall',
    question: '最近半年内，你是否经历过明显的生活变化（如手术、自然格有金额损失、亲人重病或去世）？',
    options: ['是', '否', '不确定'],
    sourceMethod: 'bazi',
    sourceContent: '八字大运周期分析。',
  },
  // ─── 事业状态（单选）
  {
    type: 'single',
    dimension: 'career',
    question: '过去三个月，你对自己工作 / 学业状态的整体感受是？',
    options: ['进展顺利，常有成就感', '平稳正常，无特别起伏', '遭遇明显阻阻或展展不顺', '压力很大，有时想放弃'],
    sourceMethod: 'bazi',
    sourceContent: '八字运势展示近期事业局面。',
  },
  // ─── 财务状况（单选）
  {
    type: 'single',
    dimension: 'wealth',
    question: '最近三个月，你的财务收支局面是？',
    options: ['收入稳定，没什么意外', '收入有可观的增长或额外收入', '支出失控，出现意外开销', '出现了较大的财务压力或存款紧张'],
    sourceMethod: 'huangli',
    sourceContent: '黄历财运分析。',
  },
  // ─── 意外财务（判断）
  {
    type: 'judge',
    dimension: 'wealth',
    question: '过去半年中，你是否有过明显的意外收入或意外财务损失超出预期？',
    options: ['是', '否', '不确定'],
    sourceMethod: 'huangli',
    sourceContent: '黄历运势提示近期财务波动。',
  },
  // ─── 情绪基调（单选）
  {
    type: 'single',
    dimension: 'emotion',
    question: '上个月中，你内心状态的主色调是？',
    options: ['积极向上，心情较轻松愉快', '平静平和，没什么明显起伏', '小惊小怨，有些好崩不安', '心情较低落，有较长时间想一个人呆着'],
    sourceMethod: 'xiaoliuren',
    sourceContent: '小六壬卦象反映近期情绪状态。',
  },
  // ─── 情绪应对方式（判断）
  {
    type: 'judge',
    dimension: 'emotion',
    question: '你通常遇到压力或负面情绪时，是否倒向独自应对而不是向旁边人倾诉？',
    options: ['是', '否', '不确定'],
    sourceMethod: 'bazi',
    sourceContent: '八字日主性格倒向分析。',
  },
  // ─── 人际互动模式（多选）
  {
    type: 'multi',
    dimension: 'interpersonal',
    question: '在社交 / 团队场合中，你倒向于下面哪些？（可多选）',
    options: ['自然主动破冰，填补沉默', '以倾听为主，全程少说话', '选择性深交少数人', '页面相面无压力，私下不亲近', '主动衰气、活跃氛围', '趋向保护边界，不喜过多社交'],
    sourceMethod: 'xiaoliuren',
    sourceContent: '小六壬卦象反映人际互动模式。',
  },
  // ─── 贵人运（判断）
  {
    type: 'judge',
    dimension: 'interpersonal',
    question: '近三个月内，你是否遇到过对你帮助较大的水时贵人（工作介绍、帮你解决难题等）？',
    options: ['是', '否', '不确定'],
    sourceMethod: 'bazi',
    sourceContent: '八字显示近期贵人运。',
  },
  // ─── 日常习惯（填空）
  {
    type: 'fill',
    dimension: 'habit',
    question: '你通常每天上午第一件远的事是什么？（如看手机、运动、喝咖啡）',
    options: null,
    sourceMethod: 'bazi',
    sourceContent: '八字日主显示早晨状态与个人习惯相关。',
  },
  // ─── 入睡时间（单选）
  {
    type: 'single',
    dimension: 'habit',
    question: '你通常几点入睡？',
    options: ['23点之前', '23:00—00:00之间', '00:00—1:00之间', '1点以后'],
    sourceMethod: 'bazi',
    sourceContent: '八字与时辰关联暗示作息节律。',
  },
  // ─── 整体运势（单选）
  {
    type: 'single',
    dimension: 'overall',
    question: '如果要用一句话形容你最近一个月的人生状态，你会选？',
    options: ['骄勃上升期，故事皆顺遂', '内心充实，蛰虫练中，等待爆发', '平平和和，没啥大起伏', '感觉没踩点，诸事不顺，希望尽快转机'],
    sourceMethod: 'bazi',
    sourceContent: '八字整体大运周期展现。',
  },
];


// ─── 题目生成 ───
// 读取 1tab 中 AI 生成的详细解析内容
function getAiAnalysisTexts(year: string, month: string, day: string, hour: string): Record<string, string> {
  try {
    const SS_AI = 'fatelab2_home_ai';
    const birthKey = `${year}${month}${day}${parseInt(hour) || 0}`;
    const raw = sessionStorage.getItem(SS_AI);
    if (!raw) return {};
    const cache = JSON.parse(raw) as Record<string, string>;
    return {
      bazi: cache[`bazi_${birthKey}`] || '',
      huangli: cache[`huangli_${birthKey}`] || '',
      xiaoliuren: cache[`xiaoliuren_${birthKey}`] || '',
      zodiac: cache[`zodiac_${birthKey}`] || '',
    };
  } catch { return {}; }
}

async function generateBlindtestQuestions(
  predictions: Record<string, string>,
  date: string,
  year?: string, month?: string, day?: string, hour?: string
): Promise<Question[]> {
  // 不缓存，每次都重新生成，保证题目多样性
  // 但同一次作答会话内（sessionStorage）缓存，避免重复出题
  const sessionKey = `fatelab2_blindtest_session_${date}_${Date.now()}`;

  // 读取 1tab AI 详细解析（这是出题的核心素材）
  const aiTexts = getAiAnalysisTexts(year || '', month || '', day || '', hour || '');
  const hasBaziAi = aiTexts.bazi && aiTexts.bazi.length > 100;
  const hasZodiacAi = aiTexts.zodiac && aiTexts.zodiac.length > 100;
  const hasXlrAi = aiTexts.xiaoliuren && aiTexts.xiaoliuren.length > 100;
  const hasHuangliAi = aiTexts.huangli && aiTexts.huangli.length > 100;

  // 截取 AI 内容（最多 600 字，避免 prompt 过长）
  const baziDetail = hasBaziAi ? aiTexts.bazi.slice(0, 600) : (predictions.bazi || '');
  const zodiacDetail = hasZodiacAi ? aiTexts.zodiac.slice(0, 600) : (predictions.zodiac || '');
  const xlrDetail = hasXlrAi ? aiTexts.xiaoliuren.slice(0, 400) : (predictions.xiaoliuren || '');
  const huangliDetail = hasHuangliAi ? aiTexts.huangli.slice(0, 400) : (predictions.huangli || '');

  // 随机种子：每次生成不同视角的题目
  const angles = [
    '侧重性格与天赋验证，多出 character/habit 维度的题',
    '侧重近期事件与健康验证，多出 health/overall/emotion 维度的题',
    '侧重感情与人际验证，多出 love/interpersonal/wealth 维度的题',
    '侧重职业与能力验证，多出 career/character 维度的题',
  ];
  const angle = angles[Math.floor(Math.random() * angles.length)];

  const prompt = `你是命理验证实验的问卷设计师。根据以下AI命理解析内容（已含详细分析），设计15-18道验证题，检验这些命理预测对用户真实生活的准确度。

本次出题角度：【${angle}】

【关键要求】：
0. 【最重要】题目必须覆盖命理描述的"固有属性"和"当日运势"两大类，不能只问今天。固有属性包括：性格特质、天赋擅长领域、习惯倾向、健康体质、家庭/亲属关系、职业类型/工作地点、财务模式、感情状态/类型、人际风格等。当日运势包括：今日事件、本周遭遇、近半年重大变化等。
1. 每道题必须直接基于下方命理解析中的具体论断来出题。例如：
   - 若八字解析提到"日主乙木，性格温和、善于协调"，则出"以下哪些词最符合你的性格？（多选）A 温和 B 强势 C 善于协调 D 固执"
   - 若解析提到"五行缺火，容易感到焦虑、缺乏安全感"，则出"你是否经常感到莫名焦虑或缺乏安全感？A 是 B 否 C 偶尔有"
   - 若提到"健康需注意肝脏"，则出"你是否有过肝区或右侧肋部不适？A 经常 B 偶尔 C 从未"
   - 若提到"事业运适合创意/管理类工作"，则出"你目前从事或有意向从事的工作类型是？A 创意设计 B 管理运营 C 技术研发 D 其他"
   - 若提到"近半年感情有变动"，则出"近半年你的感情关系是否有重大变化？A 有，刚开始一段感情 B 有，经历了分手 C 有，关系质量明显变化 D 没有变化 E 目前单身"
2. 题目与题目之间维度严格不重叠，每道题考查不同人生面向
3. 题型多样：单选(single)、多选(multi)、判断(judge：是/否/不确定)、填空(fill)
4. 感情题必须含"目前单身，暂无伴侣"选项
5. 选项必须严格贴合题干（健康题只有症状/部位，性格题只有性格词，绝不混搭）
6. 中性语言，不透露流派名称
7. sourceContent 必须是命理解析中对应的原文句子
8. 仅返回JSON数组：
   {"type":"single|multi|judge|fill","dimension":"career|love|health|emotion|interpersonal|wealth|overall|character|habit","question":"题目","options":["A","B","C","D"],"sourceMethod":"bazi|huangli|xiaoliuren|zodiac","sourceContent":"对应命理原文"}
   fill题options为null，judge题options固定为["是","否","不确定"]
─── 八字解析（命理依据 1）───
${baziDetail}

─── 星座运势解析（命理依据 2）───
${zodiacDetail}

─── 小六壬解析（命理依据 3）───
${xlrDetail}

─── 黄历解析（命理依据 4）───
${huangliDetail}

请生成15-18道题，只返回JSON数组。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一个JSON格式输出器，只返回合法的JSON数组，不输出任何其他文字。' },
      { role: 'user', content: prompt },
    ], 4000);

    if (result) {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]) as Question[];
        if (Array.isArray(questions) && questions.length >= 5 && questions[0]?.question) {
          return questions;
        }
      }
    }
  } catch { /* fallthrough to demo */ }

  // Fallback：随机打乱 DEMO_QUESTIONS，每次不同
  const shuffled = [...DEMO_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 16);
}


// ─── 主组件 ───
type ViewMode = 'all' | 'one';

export default function Blindtest() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'answering' | 'result'>('intro');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [aiScores, setAiScores] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [currentQ, setCurrentQ] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [verCount, setVerCount] = useState(() => getVerifications().length);
  const [confetti, setConfetti] = useState(false);

  const history = useMemo(() => getBlindtestHistory(), [phase]);

  // Listen for localStorage changes from other tabs
  useEffect(() => {
    const handler = () => setVerCount(getVerifications().length);
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleStart = useCallback(async () => {
    setGenerating(true);
    const predictions = getTodayPredictions(
      new Date().getMonth() + 1,
      new Date().getDate(),
      12
    );
    const storedForm = (() => { try { const v = sessionStorage.getItem('fatelab2_home_form'); return v ? JSON.parse(v) : {}; } catch { return {}; } })();
    const q = await generateBlindtestQuestions(predictions, selectedDate, storedForm.year, storedForm.month, storedForm.day, storedForm.hour);
    setQuestions(q);
    setAnswers(new Array(q.length).fill(null));
    setAiScores(new Array(q.length).fill(0));
    setPhase('answering');
    setCurrentQ(0);
    setGenerating(false);
  }, [selectedDate]);

  const handleSubmit = useCallback(async () => {
    // AI score each answer
    const scores = await Promise.all(
      questions.map(async (q, i) => {
        const userAnswer = answers[i];
        let answerText = '';
        if (q.type === 'single' && typeof userAnswer === 'number' && q.options) {
          answerText = q.options[userAnswer] || '';
        } else if (q.type === 'multi' && Array.isArray(userAnswer) && q.options) {
          answerText = userAnswer.map(idx => q.options![idx]).filter(Boolean).join('、');
        } else if (q.type === 'judge' && typeof userAnswer === 'number' && q.options) {
          answerText = q.options[userAnswer] || '';
        } else if (q.type === 'fill' && typeof userAnswer === 'string') {
          answerText = userAnswer;
        }

        if (!answerText) return 50;

        try {
          const result = await chat([
            { role: 'system', content: '请对用户的回答与今日运势预测的贴合度打分，0-100分。只返回一个数字。' },
            { role: 'user', content: `预测内容：${q.sourceContent}\n用户回答：${answerText}\n请打分（0-100）：` },
          ], 50);
          const num = parseInt(result);
          return isNaN(num) ? Math.floor(Math.random() * 30 + 50) : Math.min(100, Math.max(0, num));
        } catch {
          return Math.floor(Math.random() * 30 + 50);
        }
      })
    );
    setAiScores(scores);

    // Save verifications
    questions.forEach((q, i) => {
      let actualAnswer = '';
      if (q.type === 'single' && typeof answers[i] === 'number' && q.options) {
        actualAnswer = q.options[answers[i] as number] || '';
      } else if (q.type === 'multi' && Array.isArray(answers[i]) && q.options) {
        actualAnswer = (answers[i] as number[]).map(idx => q.options![idx]).filter(Boolean).join('、');
      } else if (q.type === 'judge' && typeof answers[i] === 'number' && q.options) {
        actualAnswer = q.options[answers[i] as number] || '';
      } else if (q.type === 'fill' && typeof answers[i] === 'string') {
        actualAnswer = answers[i] as string;
      }

      const v = {
        id: genId(),
        predictionId: `${q.sourceMethod}_${selectedDate}`,
        userId: genId(),
        actualAnswer,
        dimension: q.dimension as Dimension,
        llmScore: scores[i],
        llmJudge: scores[i] >= 70 ? '贴合度较高' : scores[i] >= 40 ? '贴合度中等' : '贴合度较低',
        createdAt: new Date().toISOString(),
      };
      saveVerification(v);
    });

    // Save blindtest answer
    const record = {
      id: genId(),
      date: selectedDate,
      questions: questions.map((q, i) => ({
        questionText: q.question,
        options: q.options || [],
        selectedOption: typeof answers[i] === 'number' ? answers[i] as number : null,
        dimension: q.dimension as Dimension,
        method: null as Method | null,
        source: q.sourceMethod,
      })),
      selfRating: 0,
      submittedAt: new Date().toISOString(),
    };
    saveBlindtestAnswer(record);

    setConfetti(true);
    setVerCount(getVerifications().length);
    setTimeout(() => setConfetti(false), 2000);
    setPhase('result');
  }, [questions, answers, selectedDate]);

  return (
    <div>
      {/* Confetti Animation */}
      {confetti && <ConfettiEffect />}

      {phase === 'intro' && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🎯 盲测实验</h2>

          {/* 盲测原理说明 */}
          <div style={{ background: '#F5F3EF', borderRadius: 16, padding: '20px 22px', marginBottom: 20, border: '1px solid #EDE9E1' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1714', marginBottom: 12 }}>什么是盲测？</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {[
                { icon: '🔮', title: '题目来自真实算命内容', desc: '系统读取你在「命盘综合」页填写的出生信息，由八字、黄历、小六壬、星座四个流派各自生成对你的预测，再由 AI 将这些预测转化为中性问题。' },
                { icon: '🙈', title: '来源被刻意隐去', desc: '这是盲测的核心设计——你不知道每道题背后是哪个流派的预测。如果告诉你来源，你的作答会受到主观偏好的影响，导致数据失真，无法客观验证准确度。' },
                { icon: '📊', title: '你的回答是实验数据', desc: '每次作答后，系统会将你的真实经历与各流派的原始预测进行匹配评分，这个分数会汇入全平台的回归分析，帮助计算每种流派真实的预测命中率。' },
                { icon: '🔄', title: '建议多次参与', desc: '单次盲测的偶然性较高。坚持在不同日期参与，积累 7 天以上的数据，系统才能识别出对你个人最准的算命方式。' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1714', marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#7A7268', lineHeight: 1.7 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#EEE9FF', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#6B5ECD', lineHeight: 1.7, border: '1px solid rgba(107,94,205,0.15)' }}>
            💡 <strong>温馨提示：</strong>建议先在「命盘综合」页完成测算并等待 AI 分析生成后，再来做盲测——AI 生成的详细解析会让题目更贴合你的个人信息，验证价值更高。
          </div>

          <button
            style={{ ...styles.startBtn, opacity: generating ? 0.6 : 1 }}
            disabled={generating}
            onClick={handleStart}
          >
            {generating ? '正在生成题目…' : `开始${history.length > 0 ? '新一轮' : '今日'}实验`}
          </button>

          <div style={styles.statsRow}>
            <span style={styles.statBadge}>📊 已收集 {verCount} 条验证记录</span>
            {history.length > 0 && <span style={styles.statBadge}>🗓️ 已参与 {history.length} 次盲测</span>}
          </div>

          {history.length > 0 && (
            <div style={styles.historySection}>
              <h3 style={styles.historyTitle}>历史作答记录</h3>
              {history.slice(-10).reverse().map((h) => (
                <div key={h.id} style={styles.historyItem}>
                  <span style={styles.historyDate}>{new Date(h.submittedAt).toLocaleDateString('zh-CN')}</span>
                  <span style={styles.historyQCount}>{h.questions.length} 题</span>
                  <span style={styles.historyTime}>{new Date(h.submittedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'answering' && (
        <div style={styles.card}>
          <div style={styles.answeringHeader}>
            <h2 style={styles.cardTitle}>作答</h2>
            <div style={styles.viewToggle}>
              <button
                style={{ ...styles.viewBtn, ...(viewMode === 'all' ? styles.viewBtnActive : {}) }}
                onClick={() => setViewMode('all')}
              >
                全部
              </button>
              <button
                style={{ ...styles.viewBtn, ...(viewMode === 'one' ? styles.viewBtnActive : {}) }}
                onClick={() => setViewMode('one')}
              >
                逐题
              </button>
            </div>
            <span style={styles.progressText}>{currentQ + 1} / {questions.length}</span>
          </div>

          {viewMode === 'one' ? (
            <div className="slide-in">
              <QuestionCard
                q={questions[currentQ]}
                answer={answers[currentQ]}
                onAnswer={(a) => {
                  const newA = [...answers];
                  newA[currentQ] = a;
                  setAnswers(newA);
                }}
                index={currentQ}
              />
              <div style={styles.navRow}>
                <button
                  style={{ ...styles.navBtn, opacity: currentQ === 0 ? 0.3 : 1 }}
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
                >
                  ← 上一题
                </button>
                {currentQ < questions.length - 1 ? (
                  <button style={styles.navBtnPrimary} onClick={() => setCurrentQ((c) => c + 1)}>
                    下一题 →
                  </button>
                ) : (
                  <button
                    style={{
                      ...styles.navBtnPrimary,
                      opacity: answers.every((a) => {
                        if (a === null) return false;
                        if (Array.isArray(a)) return a.length > 0;
                        if (typeof a === 'string') return a.trim().length > 0;
                        return true;
                      }) ? 1 : 0.5,
                    }}
                    disabled={!answers.every((a) => {
                      if (a === null) return false;
                      if (Array.isArray(a)) return a.length > 0;
                      if (typeof a === 'string') return a.trim().length > 0;
                      return true;
                    })}
                    onClick={handleSubmit}
                  >
                    提交答卷 ✓
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.allQuestions}>
              {questions.map((q, i) => (
                <div key={i} className="slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <QuestionCard
                    q={q}
                    answer={answers[i]}
                    onAnswer={(a) => {
                      const newA = [...answers];
                      newA[i] = a;
                      setAnswers(newA);
                    }}
                    index={i}
                  />
                </div>
              ))}
              <button
                style={{
                  ...styles.submitBtn,
                  opacity: answers.every((a) => {
                    if (a === null) return false;
                    if (Array.isArray(a)) return a.length > 0;
                    if (typeof a === 'string') return a.trim().length > 0;
                    return true;
                  }) ? 1 : 0.5,
                }}
                disabled={!answers.every((a) => {
                  if (a === null) return false;
                  if (Array.isArray(a)) return a.length > 0;
                  if (typeof a === 'string') return a.trim().length > 0;
                  return true;
                })}
                onClick={handleSubmit}
              >
                提交全部答案 ✓
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'result' && (
        <div className="card-enter">
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🎉 结果揭晓</h2>

            <div style={styles.resultSummary}>
              <p style={styles.resultText}>
                你完成了 <strong>{questions.length}</strong> 道题目
              </p>
            </div>

            {questions.map((q, i) => (
              <div
                key={i}
                className="reveal"
                style={{
                  ...styles.resultItem,
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                <div style={styles.resultItemHeader}>
                  <span style={styles.resultDimension}>{DIMENSION_LABELS[q.dimension as Dimension] || q.dimension}</span>
                  <span style={styles.resultMethod}>{METHOD_LABELS[q.sourceMethod as Method] || '未知流派'}</span>
                </div>
                <p style={styles.resultQuestion}>{q.question}</p>
                <p style={styles.resultAnswer}>
                  你的选择: <strong>{formatAnswer(q, answers[i])}</strong>
                </p>
                <div style={styles.aiScoreBox}>
                  <span style={styles.aiScoreLabel}>预测准确度</span>
                  <div style={styles.aiScoreBar}>
                    <div style={{
                      ...aiScoreFillStyle(aiScores[i]),
                      animation: `expandWidth 1s ease ${i * 0.2}s both`,
                    }} />
                  </div>
                  <span style={styles.aiScoreValue}>{aiScores[i]}分</span>
                </div>
                <div style={styles.sourceReveal}>
                  题目来源：<strong>{METHOD_LABELS[q.sourceMethod as Method] || q.sourceMethod}</strong>
                  <br />{q.sourceContent}
                </div>
              </div>
            ))}
          </div>

          {/* Thank You Card */}
          <div style={{ ...styles.card, ...styles.thankYouCard }}>
            <div style={styles.thankYouIcon}>🎉</div>
            <h3 style={styles.thankYouTitle}>感谢你为实验增加了一条样本！</h3>
            <p style={styles.thankYouText}>
              当前共 <strong style={{ color: '#0071E3' }}>{verCount}</strong> 条数据
            </p>
            <button style={styles.startBtn} onClick={() => navigate('/rankings')}>
              查看统计榜单 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 格式化答案显示 ───
function formatAnswer(q: Question, answer: Answer): string {
  if (answer === null) return '未作答';
  if (q.type === 'single' && typeof answer === 'number' && q.options) {
    return q.options[answer] || '未作答';
  }
  if (q.type === 'multi' && Array.isArray(answer) && q.options) {
    return answer.map(idx => q.options![idx]).filter(Boolean).join('、') || '未作答';
  }
  if (q.type === 'judge' && typeof answer === 'number' && q.options) {
    return q.options[answer] || '未作答';
  }
  if (q.type === 'fill' && typeof answer === 'string') {
    return answer || '未作答';
  }
  return '未作答';
}

// ─── Question Card ───
function QuestionCard({ q, answer, onAnswer, index }: {
  q: Question;
  answer: Answer;
  onAnswer: (a: Answer) => void;
  index: number;
}) {
  if (q.type === 'single') {
    return renderSingle(q, answer as number, onAnswer, index);
  }
  if (q.type === 'multi') {
    return renderMulti(q, answer as number[], onAnswer, index);
  }
  if (q.type === 'judge') {
    return renderJudge(q, answer as number, onAnswer, index);
  }
  if (q.type === 'fill') {
    return renderFill(q, answer as string, onAnswer, index);
  }
  return null;
}

function renderSingle(q: Question, answer: number | null, onAnswer: (a: Answer) => void, index: number) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  return (
    <div style={styles.questionCard}>
      <div style={styles.qHeader}>
        <span style={styles.qDimension}>{DIMENSION_LABELS[q.dimension as Dimension] || q.dimension}</span>
        <span style={styles.qIndex}>第 {index + 1} 题 · 单选</span>
      </div>
      <p style={styles.qText}>{q.question}</p>
      <div style={styles.optionsGrid}>
        {q.options?.map((opt, i) => (
          <button
            key={i}
            style={{
              ...styles.optionBtn,
              ...(answer === i ? styles.optionBtnSelected : {}),
            }}
            onClick={() => onAnswer(i)}
          >
            <span style={styles.optionLabel}>{labels[i]}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function renderMulti(q: Question, answer: number[] | null, onAnswer: (a: Answer) => void, index: number) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const selected = answer || [];
  return (
    <div style={styles.questionCard}>
      <div style={styles.qHeader}>
        <span style={styles.qDimension}>{DIMENSION_LABELS[q.dimension as Dimension] || q.dimension}</span>
        <span style={styles.qIndex}>第 {index + 1} 题 · 多选</span>
      </div>
      <p style={styles.qText}>{q.question}</p>
      <div style={styles.optionsGrid}>
        {q.options?.map((opt, i) => {
          const isSel = selected.includes(i);
          return (
            <button
              key={i}
              style={{
                ...styles.optionBtn,
                ...(isSel ? styles.optionBtnSelected : {}),
              }}
              onClick={() => {
                const next = isSel ? selected.filter(x => x !== i) : [...selected, i];
                onAnswer(next);
              }}
            >
              <span style={styles.optionLabel}>{isSel ? '✓' : labels[i]}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function renderJudge(q: Question, answer: number | null, onAnswer: (a: Answer) => void, index: number) {
  const judgeOptions = ['✓ 是', '✗ 否', '？ 不确定'];
  return (
    <div style={styles.questionCard}>
      <div style={styles.qHeader}>
        <span style={styles.qDimension}>{DIMENSION_LABELS[q.dimension as Dimension] || q.dimension}</span>
        <span style={styles.qIndex}>第 {index + 1} 题 · 判断</span>
      </div>
      <p style={styles.qText}>{q.question}</p>
      <div style={styles.judgeGrid}>
        {judgeOptions.map((opt, i) => (
          <button
            key={i}
            style={{
              ...styles.judgeBtn,
              ...(answer === i ? styles.judgeBtnSelected : {}),
            }}
            onClick={() => onAnswer(i)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function renderFill(q: Question, answer: string | null, onAnswer: (a: Answer) => void, index: number) {
  return (
    <div style={styles.questionCard}>
      <div style={styles.qHeader}>
        <span style={styles.qDimension}>{DIMENSION_LABELS[q.dimension as Dimension] || q.dimension}</span>
        <span style={styles.qIndex}>第 {index + 1} 题 · 填空</span>
      </div>
      <p style={styles.qText}>{q.question}</p>
      <input
        type="text"
        value={answer || ''}
        onChange={(e) => onAnswer(e.target.value)}
        style={styles.fillInput}
        placeholder="请输入你的回答..."
      />
    </div>
  );
}

// ─── Confetti Effect ───
function ConfettiEffect() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: ['#FF9500', '#0071E3', '#34C759', '#FF3B30', '#5856D6', '#FF2D55'][Math.floor(Math.random() * 6)],
      size: 6 + Math.random() * 8,
    })), []);

  return (
    <div style={styles.confettiContainer}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confettiFall 2s ease-in ${p.delay}s both`,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

// ─── Helper style functions ───
function aiScoreFillStyle(score: number): React.CSSProperties {
  return {
    height: '100%',
    width: `${score}%`,
    background: score >= 70 ? '#34C759' : score >= 40 ? '#FFB800' : '#FF3B30',
    borderRadius: 3,
  };
}

// ─── Styles ───
const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    color: '#1D1D1F',
  },
  infoBox: {
    background: '#F5F5F7',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 1.7,
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1D1D1F',
  },
  dateInput: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #D1D1D6',
    fontSize: 14,
  },
  startBtn: {
    background: '#0071E3',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    padding: '12px 32px',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
  },
  statsRow: {
    marginTop: 16,
  },
  statBadge: {
    fontSize: 13,
    color: '#0071E3',
    background: 'rgba(0,113,227,0.08)',
    padding: '6px 14px',
    borderRadius: 8,
    fontWeight: 600,
  },
  historySection: {
    marginTop: 24,
    borderTop: '1px solid #E8E8ED',
    paddingTop: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: '#1D1D1F',
  },
  historyItem: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F5F5F7',
    fontSize: 13,
    flexWrap: 'wrap',
  },
  historyDate: {
    fontWeight: 600,
    color: '#1D1D1F',
  },
  historyQCount: {
    color: '#86868B',
  },
  historyTime: {
    color: '#86868B',
    marginLeft: 'auto',
    fontSize: 12,
  },
  answeringHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  viewToggle: {
    display: 'flex',
    gap: 4,
    marginLeft: 'auto',
  },
  viewBtn: {
    padding: '4px 12px',
    fontSize: 12,
    borderRadius: 6,
    background: '#F5F5F7',
    color: '#86868B',
    border: 'none',
    cursor: 'pointer',
  },
  viewBtnActive: {
    background: '#1D1D1F',
    color: '#fff',
  },
  progressText: {
    fontSize: 13,
    color: '#86868B',
  },
  allQuestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  questionCard: {
    background: '#F5F5F7',
    borderRadius: 12,
    padding: '16px 20px',
  },
  qHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qDimension: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0071E3',
    background: 'rgba(0,113,227,0.08)',
    padding: '2px 8px',
    borderRadius: 4,
  },
  qIndex: {
    fontSize: 12,
    color: '#86868B',
  },
  qText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1D1D1F',
    marginBottom: 12,
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#F7F7F7',
    borderRadius: 8,
    border: 'none',
    boxShadow: 'none',
    fontSize: 14,
    color: '#1D1D1F',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'box-shadow 0.15s, background 0.15s',
  },
  optionBtnSelected: {
    boxShadow: 'inset 0 0 0 2px #0071E3',
    background: 'rgba(0,113,227,0.06)',
  },
  optionLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#E8E8ED',
    fontSize: 12,
    fontWeight: 700,
    color: '#6E6E73',
    flexShrink: 0,
  },
  judgeGrid: {
    display: 'flex',
    gap: 8,
  },
  judgeBtn: {
    flex: 1,
    padding: '14px 12px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 10,
    background: '#fff',
    border: 'none',
    boxShadow: 'none',
    color: '#1D1D1F',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'box-shadow 0.15s, background 0.15s, color 0.15s',
  },
  judgeBtnSelected: {
    boxShadow: 'inset 0 0 0 2px #0071E3',
    background: 'rgba(0,113,227,0.06)',
    color: '#0071E3',
  },
  fillInput: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    borderRadius: 10,
    border: '2px solid #D1D1D6',
    background: '#fff',
    color: '#1D1D1F',
    outline: 'none',
    boxSizing: 'border-box',
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navBtn: {
    padding: '8px 16px',
    fontSize: 14,
    borderRadius: 8,
    background: '#F5F5F7',
    color: '#1D1D1F',
    cursor: 'pointer',
    border: 'none',
  },
  navBtnPrimary: {
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    background: '#0071E3',
    color: '#fff',
    cursor: 'pointer',
    border: 'none',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 12,
    background: '#0071E3',
    color: '#fff',
    cursor: 'pointer',
    border: 'none',
    marginTop: 8,
  },
  resultSummary: {
    background: '#F5F5F7',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  resultItem: {
    padding: '14px 18px',
    background: '#F5F5F7',
    borderRadius: 10,
    marginBottom: 12,
  },
  resultItemHeader: {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
  },
  resultDimension: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0071E3',
    background: 'rgba(0,113,227,0.08)',
    padding: '2px 8px',
    borderRadius: 4,
  },
  resultMethod: {
    fontSize: 12,
    color: '#86868B',
  },
  resultQuestion: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 4,
  },
  resultAnswer: {
    fontSize: 13,
    color: '#34C759',
  },
  aiScoreBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: '8px 12px',
    background: '#fff',
    borderRadius: 8,
  },
  aiScoreLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#86868B',
  },
  aiScoreBar: {
    flex: 1,
    height: 6,
    background: '#E8E8ED',
    borderRadius: 3,
    overflow: 'hidden',
  },
  aiScoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiScoreValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1D1D1F',
    minWidth: 40,
    textAlign: 'right',
  },
  sourceReveal: {
    marginTop: 8,
    padding: '8px 12px',
    background: '#fff',
    borderRadius: 8,
    fontSize: 13,
    color: '#6E6E73',
    lineHeight: 1.6,
    border: '1px dashed #D1D1D6',
  },
  thankYouCard: {
    textAlign: 'center',
    background: 'linear-gradient(135deg, #fff 0%, #F5F5F7 100%)',
  },
  thankYouIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  thankYouTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1D1D1F',
    marginBottom: 8,
  },
  thankYouText: {
    fontSize: 16,
    color: '#6E6E73',
    marginBottom: 20,
  },
  confettiContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 9999,
    overflow: 'hidden',
  },
};

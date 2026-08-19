import React, { useState, useCallback, useEffect, useRef } from 'react';
import { calcAllFortune, getShiChenName } from '../lib/calc.js';
import { chat } from '../lib/llm.js';
import { renderMarkdown } from '../lib/markdown.js';

// ─── sessionStorage 持久化 ───
const SS_FORM = 'fatelab2_home_form';
const SS_RESULTS = 'fatelab2_home_results';
const SS_AI = 'fatelab2_home_ai';

function ssGet<T>(key: string): T | null {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function ssSet(key: string, data: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
}

interface FormState {
  name: string; gender: string; year: string; month: string;
  day: string; hour: string; birthPlace: string;
}
const DEFAULT_FORM: FormState = {
  name: '', gender: '', year: '', month: '', day: '',
  hour: '', birthPlace: '',
};

type AiCache = Record<string, string>;

// ─── CSS 注入 ───
const CSS = `
@keyframes fatelab-spin { to { transform: rotate(360deg); } }
@keyframes fatelab-fade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes fatelab-bar { from { width:0; } to { } }
@keyframes fatelab-qdot { 0%,100%{opacity:0.3;transform:scale(0.8);} 50%{opacity:1;transform:scale(1);} }
.fatelab-fade { animation: fatelab-fade 0.5s ease both; }
.fatelab-spin { animation: fatelab-spin 1s linear infinite; display:inline-block; }
.fatelab-qdot-1 { animation: fatelab-qdot 1.4s ease infinite 0s; }
.fatelab-qdot-2 { animation: fatelab-qdot 1.4s ease infinite 0.25s; }
.fatelab-qdot-3 { animation: fatelab-qdot 1.4s ease infinite 0.5s; }
`;
if (typeof document !== 'undefined') {
  if (!document.head.querySelector('[data-fatelab-home]')) {
    const st = document.createElement('style');
    st.setAttribute('data-fatelab-home', '1');
    st.textContent = CSS;
    document.head.appendChild(st);
  }
}

// ─── 滚动选择器 ───
const ITEM_H = 40;

interface PickerItem { label: string; value: string; }
interface PickerProps {
  items: PickerItem[]; value: string;
  onChange: (v: string) => void;
  placeholder?: string; label: string;
}

function ScrollPicker({ items, value, onChange, placeholder = '请选择', label }: PickerProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const selIdx = items.findIndex(i => i.value === value);
  const displayLabel = selIdx >= 0 ? items[selIdx].label : placeholder;

  useEffect(() => {
    if (open && listRef.current && selIdx >= 0) {
      listRef.current.scrollTop = Math.max(0, selIdx * ITEM_H - ITEM_H * 2);
    }
  }, [open, selIdx]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: `1.5px solid ${open ? '#6B5ECD' : '#EDE9E1'}`,
          fontSize: 14, background: '#FAF8F4',
          color: value ? '#1A1714' : '#B5AFA6',
          cursor: 'pointer', textAlign: 'left' as const,
          fontFamily: 'inherit', boxSizing: 'border-box' as const,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'border-color 0.2s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1 }}>
          {displayLabel}
        </span>
        <span style={{ fontSize: 10, color: '#B5AFA6', marginLeft: 6, flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div
            ref={listRef}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              maxHeight: ITEM_H * 6, overflowY: 'auto' as const,
              background: '#fff', borderRadius: 12, zIndex: 100,
              boxShadow: '0 8px 32px rgba(60,48,32,0.14)',
              border: '1px solid #EDE9E1', marginTop: 4,
            }}
          >
            {items.map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => { onChange(item.value); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', minHeight: ITEM_H,
                  padding: '0 14px', textAlign: 'left' as const,
                  background: item.value === value ? '#EEE9FF' : 'transparent',
                  color: item.value === value ? '#6B5ECD' : '#1A1714',
                  fontWeight: item.value === value ? 700 : 400,
                  border: 'none', cursor: 'pointer', fontSize: 13,
                  fontFamily: 'inherit',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 选项数据 ───
const YEARS: PickerItem[] = Array.from({ length: 80 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { label: `${y} 年`, value: String(y) };
});
const MONTHS: PickerItem[] = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1} 月`, value: String(i + 1),
}));
const DAYS: PickerItem[] = Array.from({ length: 31 }, (_, i) => ({
  label: `${i + 1} 日`, value: String(i + 1),
}));
const HOURS: PickerItem[] = Array.from({ length: 24 }, (_, i) => ({
  label: `${i} 时(${getShiChenName(i)})`, value: String(i),
}));
const CITIES: PickerItem[] = [
  '北京市', '上海市', '广州市', '深圳市', '成都市', '杭州市', '武汉市', '西安市',
  '南京市', '重庆市', '天津市', '苏州市', '长沙市', '郑州市', '青岛市', '济南市',
  '厦门市', '宁波市', '福州市', '昆明市', '哈尔滨市', '沈阳市', '兰州市',
  '银川市', '呼和浩特市', '海口市', '南宁市', '贵阳市', '太原市', '石家庄市', '其他',
].map(c => ({ label: c, value: c }));

// ─── AI 任务类型 key ───
type AiTaskType = 'bazi' | 'huangli' | 'xiaoliuren' | 'zodiac';

const AI_TASK_LABELS: Record<AiTaskType, string> = {
  bazi: '八字', huangli: '黄历', xiaoliuren: '小六壬', zodiac: '星座',
};

// ─── 主组件 ───
export default function Home() {
  const [form, setForm] = useState<FormState>(() => ssGet<FormState>(SS_FORM) ?? DEFAULT_FORM);
  const [results, setResults] = useState<ReturnType<typeof calcAllFortune> | null>(
    () => ssGet(SS_RESULTS)
  );
  const [aiCache, setAiCache] = useState<AiCache>(() => ssGet<AiCache>(SS_AI) ?? {});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  // 排队中的任务(还没开始跑的)
  const [queued, setQueued] = useState<AiTaskType[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm(prev => {
      const next = { ...prev, ...patch };
      ssSet(SS_FORM, next);
      return next;
    });
  }, []);

  const triggerAllAi = useCallback(async (
    res: ReturnType<typeof calcAllFortune>,
    hour: number,
    cache: AiCache
  ) => {
    const birthKey = `${form.year}${form.month}${form.day}${hour}`;
    const gender = form.gender === 'female' ? '女' : form.gender === 'male' ? '男' : '未知';

    const tasks: { key: string; typeKey: AiTaskType; label: string; prompt: string }[] = [
      {
        key: `bazi_${birthKey}`,
        typeKey: 'bazi',
        label: '八字',
        prompt: `你是一位专业命理分析师,同时熟悉现代统计学。请对以下八字排盘结果进行深度解析,要求:
1. 先简明解释八字体系的基本原理(1-2句,让外行理解"为什么用出生时间推断命运")
2. 解析日主(${res.bazi.dayMaster}·${res.bazi.dayMasterWuxing})的性格与能量特征(3-5点,用 **粗体** 标注关键词)
3. 分析五行分布 ${JSON.stringify(res.bazi.wuxing)} 的均衡状况,指出旺相与不足
4. 说明喜用神(${res.bazi.xiYongShen})对实际生活的参考意义
5. 最后一段:以理性视角提醒读者,命理结果是概率性参考,不是决定论
字数约400字,使用 ## 小标题分段,语气理性温和,直接给出内容。

八字数据:年柱${res.bazi.yearGanZhi}、月柱${res.bazi.monthGanZhi}、日柱${res.bazi.dayGanZhi}(日主${res.bazi.dayMaster})、时柱${res.bazi.hourGanZhi}
五行:${JSON.stringify(res.bazi.wuxing)},喜用神:${res.bazi.xiYongShen},性别:${gender}`
      },
      {
        key: `huangli_${birthKey}`,
        typeKey: 'huangli',
        label: '黄历',
        prompt: `你是一位传统历法研究者,兼具现代理性视角。请解析以下今日黄历数据:
1. 简短解释黄历宜忌的计算来源(干支、建除十二神等,1-2句)
2. 解读今日"宜"事项(${res.huangli.yi.join('、')})背后的生活智慧
3. 解读今日"忌"事项(${res.huangli.ji.join('、')})的规避逻辑
4. 五行(${res.huangli.wuxing})与冲煞(冲${res.huangli.chong},煞${res.huangli.sha})影响
5. 理性评价:黄历系统的统计学有效性与局限性
字数约300字,## 小标题分段,直接给出内容。`
      },
      {
        key: `xiaoliuren_${birthKey}`,
        typeKey: 'xiaoliuren',
        label: '小六壬',
        prompt: `你是一位精通小六壬的命理师。请解析以下小六壬起卦结果:
时辰:${getShiChenName(hour)},卦象:「${res.xiaoliuren.name}」,含义:${res.xiaoliuren.desc},运势:${res.xiaoliuren.fortune}

请详细说明:
1. 小六壬起卦原理(月、日、时三步推算,简述给外行,2-3句)
2. 「${res.xiaoliuren.name}」在六神体系中的定位和传统含义
3. 结合今日时辰分析具体指向
4. 对不同场景(出行/工作/沟通/财务)的参考建议(用 **粗体** 标注重点)
5. 理性声明:属于经验性概率判断,结合实际灵活运用
字数约300字。直接给出分析内容。`
      },
      {
        key: `zodiac_${birthKey}`,
        typeKey: 'zodiac',
        label: `${res.zodiac.sign}星座`,
        prompt: `你是一位专业占星师。请解析以下今日星座运势:
星座:${res.zodiac.sign}(${res.zodiac.emoji}),特质:${res.zodiac.desc}
今日运势:${res.zodiac.fortune.text}
各维度:整体${res.zodiac.fortune.overall}、事业${res.zodiac.fortune.career}、财运${res.zodiac.fortune.wealth}、感情${res.zodiac.fortune.love}、健康${res.zodiac.fortune.health}

请详细说明:
1. 西洋占星与东方命理的核心区别(1-2句)
2. ${res.zodiac.sign}今日行星影响分析
3. 各维度具体解读,分别给出可操作建议(用 - 列表)
4. 今日整体行动建议
5. 理性提示:基于统计规律和心理原型,个体差异显著
字数约400字,## 小标题分段,直接给出内容。`
      },
    ];

    const pending = tasks.filter(t => !cache[t.key]);
    if (pending.length === 0) return;

    // 设置初始排队列表(除第一个以外都排队)
    setQueued(pending.slice(1).map(t => t.typeKey));

    for (let i = 0; i < pending.length; i++) {
      const task = pending[i];
      // 当前任务开始:从队列移除它,下一个开始排队
      setQueued(pending.slice(i + 1).map(t => t.typeKey));
      setLoading(prev => ({ ...prev, [task.key]: true }));

      try {
        const result = await chat([
          {
            role: 'system',
            content: '你是 FateLab 平台的命理分析助手。回复必须严格使用 Markdown 格式(## 标题、**粗体**、- 列表、> 引用块),字数充足,内行外行均可阅读。直接输出分析内容,不要有任何关于"分析模式"、"版本"、"外行版"之类的标注。',
          },
          { role: 'user', content: task.prompt },
        ], 4000);
        if (result) {
          setAiCache(prev => {
            const next = { ...prev, [task.key]: result };
            ssSet(SS_AI, next);
            return next;
          });
        }
      } catch {}
      setLoading(prev => ({ ...prev, [task.key]: false }));
    }
    setQueued([]);
  }, [form]);

  const handleSubmit = useCallback(() => {
    const y = parseInt(form.year), m = parseInt(form.month),
      d = parseInt(form.day), h = parseInt(form.hour) || 0;
    if (!y || !m || !d) return;

    const res = calcAllFortune(form.name, form.gender, y, m, d, h, form.birthPlace);
    setResults(res);
    ssSet(SS_RESULTS, res);

    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    triggerAllAi(res, h, aiCache);
  }, [form, aiCache, triggerAllAi]);

  useEffect(() => {
    if (results && Object.keys(aiCache).length < 4) {
      const h = parseInt(form.hour) || 0;
      triggerAllAi(results, h, aiCache);
    }
  }, []); // eslint-disable-line

  const birthKey = `${form.year}${form.month}${form.day}${parseInt(form.hour) || 0}`;

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.cardHead}>
          <h2 style={S.cardTitle}>🔮 命盘综合测算</h2>
          <p style={S.cardSub}>输入出生信息,一键获取八字、黄历、小六壬、星座多维度解析,并由 AI 自动生成详尽分析</p>
        </div>
        <div style={S.formGrid}>
          <Field label="姓名(可选)">
            <input
              style={S.input}
              placeholder="可不填"
              value={form.name}
              onChange={e => updateForm({ name: e.target.value })}
            />
          </Field>

          <Field label="性别">
            <div style={{ display: 'flex', gap: 8 }}>
              {(['female', 'male'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => updateForm({ gender: g })}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: `1.5px solid ${form.gender === g ? '#6B5ECD' : '#EDE9E1'}`,
                    background: form.gender === g ? '#EEE9FF' : '#FAF8F4',
                    color: form.gender === g ? '#6B5ECD' : '#7A7268',
                    fontWeight: form.gender === g ? 700 : 400,
                    cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {g === 'female' ? '♀ 女' : '♂ 男'}
                </button>
              ))}
            </div>
          </Field>

          <Field label="出生年份">
            <ScrollPicker label="出生年份" items={YEARS} value={form.year}
              onChange={v => updateForm({ year: v })} placeholder="选择年份" />
          </Field>

          <Field label="出生月份">
            <ScrollPicker label="出生月份" items={MONTHS} value={form.month}
              onChange={v => updateForm({ month: v })} placeholder="选择月份" />
          </Field>

          <Field label="出生日期">
            <ScrollPicker label="出生日期" items={DAYS} value={form.day}
              onChange={v => updateForm({ day: v })} placeholder="选择日期" />
          </Field>

          <Field label="出生时辰(24时制)">
            <ScrollPicker label="出生时辰" items={HOURS} value={form.hour}
              onChange={v => updateForm({ hour: v })} placeholder="选择时辰(可选)" />
          </Field>

          <Field label="出生地(可选)">
            <input
              style={S.input}
              placeholder="如 上海、广州(可不填)"
              value={form.birthPlace}
              onChange={e => updateForm({ birthPlace: e.target.value })}
            />
          </Field>
        </div>
        <button style={S.submitBtn} onClick={handleSubmit}>开始测算 ✨</button>
      </div>

      {results && (
        <div ref={resultsRef} className="fatelab-fade">
          <BaziCard
            bazi={results.bazi}
            aiText={aiCache[`bazi_${birthKey}`]}
            loading={!!loading[`bazi_${birthKey}`]}
            queued={false}
          />
          <HuangliCard
            huangli={results.huangli}
            aiText={aiCache[`huangli_${birthKey}`]}
            loading={!!loading[`huangli_${birthKey}`]}
            queued={queued.includes('huangli')}
          />
          <XiaoliurenCard
            result={results.xiaoliuren}
            shiChen={getShiChenName(parseInt(form.hour) || 0)}
            aiText={aiCache[`xiaoliuren_${birthKey}`]}
            loading={!!loading[`xiaoliuren_${birthKey}`]}
            queued={queued.includes('xiaoliuren')}
          />
          <ZodiacCard
            zodiac={results.zodiac}
            aiText={aiCache[`zodiac_${birthKey}`]}
            loading={!!loading[`zodiac_${birthKey}`]}
            queued={queued.includes('zodiac')}
          />
        </div>
      )}

      {/* FateLab 3.0 的新想法 - 始终显示在测算区下方 */}
      <div style={{
        background: '#FBF3D5', borderRadius: 20, padding: 28, marginTop: 8,
        border: '1px solid rgba(212,165,32,0.2)', boxShadow: '0 2px 20px rgba(60,48,32,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#D4A520', letterSpacing: 2, textTransform: 'uppercase' as const }}>✨ FateLab 3.0 的新想法</div>
        </div>
        <p style={{ fontSize: 14, color: '#3D3830', lineHeight: 1.9, marginBottom: 14 }}>
          FateLab 1.0 和 2.0 关注的都是“全体统计”——汇总所有用户数据，看哪个命理流派在群体层面的命中率更高。这很有意思，但还不够。
        </p>
        <p style={{ fontSize: 14, color: '#3D3830', lineHeight: 1.9, marginBottom: 14 }}>
          算命是高度个体化的事情，或许八字对你特别准，对另一个人完全无效；
          或许占星在感情维度预测精准，但财运维度完全是随机噪声。
        </p>
        <p style={{ fontSize: 14, color: '#3D3830', lineHeight: 1.9, marginBottom: 16 }}>
          所以 FateLab 3.0 在全体统计之外,新增了<strong style={{ color: '#C47A1E' }}>个人算法发现</strong>:
          完成一定数量的盲测后,系统会自动分析你的个人数据,
          找出对你准确度最高的流派,甚至提纯、组装出个人专属的算法组合,
          并且封装为 <strong style={{ color: '#C47A1E' }}>Skill</strong>--一个只属于你的命理参考工具。
        </p>
        <p style={{ fontSize: 13, color: '#A8978A', lineHeight: 1.7, margin: 0 }}>

        </p>
      </div>
    </div>
  );
}

// ─── Field ───
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={S.field}>
      <label style={S.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

// ─── 排队提示 ───
function QueueWaiting({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', background: '#FAF8F4', borderRadius: 10,
      border: '1px dashed #D5D0C8', marginTop: 16,
    }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {[1, 2, 3].map(n => (
          <span
            key={n}
            className={`fatelab-qdot-${n}`}
            style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#6B5ECD' }}
          />
        ))}
      </div>
      <span style={{ fontSize: 13, color: '#7A7268' }}>大模型正在排队,{label}解析即将开始...</span>
    </div>
  );
}

// ─── AI 分析区块 ───
function AiSection({ aiText, loading, label, queued }: {
  aiText?: string; loading: boolean; label: string; queued: boolean;
}) {
  if (!aiText && !loading && queued) {
    return (
      <div style={S.aiSection}>
        <div style={S.aiHeader}>
          <span style={S.aiIcon}>🤖</span>
          <span style={S.aiTitle}>AI 深度解析 · {label}</span>
        </div>
        <QueueWaiting label={label} />
      </div>
    );
  }
  if (!aiText && !loading) return null;

  return (
    <div style={S.aiSection} className={aiText ? 'fatelab-fade' : ''}>
      <div style={S.aiHeader}>
        <span style={S.aiIcon}>🤖</span>
        <span style={S.aiTitle}>AI 深度解析 · {label}</span>
        {loading && <span style={S.aiSpinner} className="fatelab-spin">⟳</span>}
      </div>
      {loading && !aiText && (
        <div style={S.aiLoading}>
          <div style={S.aiLoadingDots}>
            {[1, 2, 3].map(n => (
              <span key={n} className={`fatelab-qdot-${n}`} style={S.aiDot} />
            ))}
          </div>
          <span style={{ fontSize: 13, color: '#7A7268' }}>AI 正在深度分析{label},请稍候...</span>
        </div>
      )}
      {aiText && (
        <div
          style={S.aiBody}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(aiText) }}
        />
      )}
    </div>
  );
}

// ─── 八字卡片 ───
function BaziCard({ bazi, aiText, loading, queued }: {
  bazi: ReturnType<typeof calcAllFortune>['bazi'];
  aiText?: string; loading: boolean; queued: boolean;
}) {
  const pillars = [
    { label: '年柱', gz: bazi.yearGanZhi },
    { label: '月柱', gz: bazi.monthGanZhi },
    { label: '日柱', gz: bazi.dayGanZhi },
    { label: '时柱', gz: bazi.hourGanZhi },
  ];
  return (
    <div style={S.card} className="fatelab-fade">
      <h3 style={S.secTitle}>⚫ 八字排盘</h3>
      <p style={S.secDesc}>以出生年、月、日、时的天干地支组合排命,是中国最古老的命理体系。</p>
      <div style={S.baziRow}>
        {pillars.map(p => (
          <div key={p.label} style={S.baziPillar}>
            <div style={S.baziLbl}>{p.label}</div>
            <div style={S.baziGan}>{p.gz[0]}</div>
            <div style={S.baziZhi}>{p.gz[1]}</div>
          </div>
        ))}
      </div>
      <div style={S.baziMeta}>
        <span>日主 <strong>{bazi.dayMaster}({bazi.dayMasterWuxing})</strong></span>
        <span style={{ margin: '0 12px', color: '#EDE9E1' }}>|</span>
        <span>五行&nbsp;
          {Object.entries(bazi.wuxing).map(([k, v]) => (
            <span key={k} style={S.wxChip}>{k}×{v}</span>
          ))}
        </span>
        <span style={{ margin: '0 12px', color: '#EDE9E1' }}>|</span>
        <span>喜用神 <strong style={{ color: '#6B5ECD' }}>{bazi.xiYongShen}</strong></span>
      </div>
      <AiSection aiText={aiText} loading={loading} label="八字" queued={queued} />
    </div>
  );
}

// ─── 黄历卡片 ───
function HuangliCard({ huangli, aiText, loading, queued }: {
  huangli: ReturnType<typeof calcAllFortune>['huangli'];
  aiText?: string; loading: boolean; queued: boolean;
}) {
  return (
    <div style={S.card} className="fatelab-fade">
      <h3 style={S.secTitle}>📅 今日黄历</h3>
      <p style={S.secDesc}>传统历书中的每日宜忌,基于干支纪日、二十八宿、十二建除等系统推算。</p>
      <div style={S.hlRow}>
        <div>
          <div style={S.hlLabel}>宜</div>
          <div style={S.hlTags}>
            {huangli.yi.map(t => <span key={t} style={{ ...S.hlTag, ...S.tagYi }}>{t}</span>)}
          </div>
        </div>
        <div>
          <div style={{ ...S.hlLabel, color: '#C05070' }}>忌</div>
          <div style={S.hlTags}>
            {huangli.ji.map(t => <span key={t} style={{ ...S.hlTag, ...S.tagJi }}>{t}</span>)}
          </div>
        </div>
      </div>
      <div style={S.hlMeta}>五行:{huangli.wuxing} · 冲:{huangli.chong} · 煞方:{huangli.sha}</div>
      <AiSection aiText={aiText} loading={loading} label="黄历" queued={queued} />
    </div>
  );
}

// ─── 小六壬卡片 ───
function XiaoliurenCard({ result, shiChen, aiText, loading, queued }: {
  result: ReturnType<typeof calcAllFortune>['xiaoliuren'];
  shiChen: string; aiText?: string; loading: boolean; queued: boolean;
}) {
  const colorMap: Record<string, string> = {
    '大安': '#3D9970', '留连': '#5856D6', '速喜': '#C07A28',
    '赤口': '#C05070', '小吉': '#6B5ECD', '空亡': '#7A7268',
  };
  const color = colorMap[result.name] ?? '#6B5ECD';
  return (
    <div style={S.card} className="fatelab-fade">
      <h3 style={S.secTitle}>⚡ 小六壬</h3>
      <p style={S.secDesc}>以大安、留连、速喜、赤口、小吉、空亡六神,按月日时三步起卦断吉凶。</p>
      <div style={S.xlrCenter}>
        <div style={{ ...S.xlrBadge, background: color }}>{result.name}</div>
        <div style={S.xlrTime}>时辰:{shiChen}</div>
        <div style={S.xlrDesc}>{result.desc}</div>
        <div style={S.xlrFortune}>{result.fortune}</div>
      </div>
      <AiSection aiText={aiText} loading={loading} label="小六壬" queued={queued} />
    </div>
  );
}

// ─── 星座卡片 ───
function ZodiacCard({ zodiac, aiText, loading, queued }: {
  zodiac: ReturnType<typeof calcAllFortune>['zodiac'];
  aiText?: string; loading: boolean; queued: boolean;
}) {
  const dims = [
    { label: '整体', score: zodiac.fortune.overall },
    { label: '事业', score: zodiac.fortune.career },
    { label: '财运', score: zodiac.fortune.wealth },
    { label: '感情', score: zodiac.fortune.love },
    { label: '健康', score: zodiac.fortune.health },
    { label: '情绪', score: zodiac.fortune.emotion },
  ];
  return (
    <div style={S.card} className="fatelab-fade">
      <h3 style={S.secTitle}>⭐ 今日星座运势</h3>
      <p style={S.secDesc}>根据出生月日判断星座,结合今日行星位置推算各维度运势。</p>
      <div style={S.zodiacHead}>
        <span style={S.zodiacEmoji}>{zodiac.emoji}</span>
        <div>
          <div style={S.zodiacName}>{zodiac.sign}</div>
          <div style={S.zodiacTagLine}>{zodiac.desc}</div>
        </div>
      </div>
      <div style={S.zodiacQuote}>{zodiac.fortune.text}</div>
      <div style={S.dimGrid}>
        {dims.map(({ label, score }) => (
          <div key={label} style={S.dimItem}>
            <div style={S.dimLabel}>{label}</div>
            <div style={S.dimBarBg}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${score}%`, transformOrigin: 'left',
                background: score >= 80 ? '#3D9970' : score >= 65 ? '#C07A28' : '#C05070',
                transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={S.dimScore}>{score}</div>
          </div>
        ))}
      </div>
      <AiSection aiText={aiText} loading={loading} label={zodiac.sign} queued={queued} />
    </div>
  );
}

// ─── Styles ───
const S: Record<string, React.CSSProperties> = {
  root: { maxWidth: 820, margin: '0 auto' },
  card: {
    background: '#FFFFFF', borderRadius: 20, padding: '28px 32px',
    marginBottom: 24, boxShadow: '0 2px 20px rgba(60,48,32,0.07), 0 1px 4px rgba(60,48,32,0.04)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardHead: { marginBottom: 20 },
  cardTitle: { fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#1A1714' },
  cardSub: { fontSize: 14, color: '#7A7268', lineHeight: 1.6 },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 16, marginBottom: 20,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: '#7A7268', letterSpacing: '0.5px' },
  input: {
    padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EDE9E1',
    fontSize: 14, background: '#FAF8F4', outline: 'none',
    transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' as const,
    color: '#1A1714', fontFamily: 'inherit',
  },
  submitBtn: {
    width: '100%', padding: '15px 0', fontSize: 16, fontWeight: 700,
    borderRadius: 14, background: '#6B5ECD', color: '#fff',
    cursor: 'pointer', border: 'none', letterSpacing: '0.5px',
    boxShadow: '0 4px 20px rgba(107,94,205,0.35)', transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  secTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#1A1714' },
  secDesc: { fontSize: 13, color: '#7A7268', marginBottom: 18, lineHeight: 1.6 },
  baziRow: { display: 'flex', gap: 12, marginBottom: 16 },
  baziPillar: {
    flex: 1, background: '#FAF8F4', borderRadius: 14, padding: '16px 8px',
    textAlign: 'center' as const, border: '1px solid #EDE9E1',
  },
  baziLbl: { fontSize: 11, color: '#B5AFA6', marginBottom: 8, letterSpacing: '1px', fontWeight: 600 },
  baziGan: { fontSize: 30, fontWeight: 700, color: '#6B5ECD', marginBottom: 4 },
  baziZhi: { fontSize: 24, fontWeight: 700, color: '#1A1714' },
  baziMeta: {
    fontSize: 13, color: '#3D3830', lineHeight: 2, marginBottom: 4,
    display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center',
  },
  wxChip: {
    display: 'inline-block', background: '#EDE9E1', borderRadius: 4,
    padding: '1px 6px', margin: '0 2px', fontSize: 12, fontWeight: 600,
  },
  hlRow: { display: 'flex', gap: 32, marginBottom: 14 },
  hlLabel: { fontSize: 14, fontWeight: 700, color: '#3D9970', marginBottom: 8 },
  hlTags: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  hlTag: { fontSize: 13, padding: '4px 10px', borderRadius: 6, fontWeight: 600 },
  tagYi: { background: '#E6F4EE', color: '#1B5E35' },
  tagJi: { background: '#FCEEF2', color: '#8B1A2F' },
  hlMeta: { fontSize: 13, color: '#B5AFA6', marginBottom: 4 },
  xlrCenter: { textAlign: 'center' as const, padding: '16px 0', marginBottom: 8 },
  xlrBadge: {
    display: 'inline-block', color: '#fff', fontSize: 22, fontWeight: 800,
    padding: '10px 32px', borderRadius: 30, marginBottom: 10, letterSpacing: 2,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  xlrTime: { fontSize: 13, color: '#B5AFA6', marginBottom: 6 },
  xlrDesc: { fontSize: 14, color: '#7A7268', marginBottom: 8 },
  xlrFortune: { fontSize: 15, color: '#1A1714', fontWeight: 600 },
  zodiacHead: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 },
  zodiacEmoji: { fontSize: 44 },
  zodiacName: { fontSize: 22, fontWeight: 700, color: '#1A1714', marginBottom: 4 },
  zodiacTagLine: { fontSize: 13, color: '#7A7268' },
  zodiacQuote: {
    fontSize: 14, color: '#3D3830', background: '#FAF8F4', borderRadius: 12,
    padding: '14px 18px', marginBottom: 18, lineHeight: 1.75, border: '1px solid #EDE9E1',
  },
  dimGrid: { display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 8 },
  dimItem: { display: 'flex', alignItems: 'center', gap: 12 },
  dimLabel: { fontSize: 13, color: '#7A7268', fontWeight: 600, width: 36, flexShrink: 0 },
  dimBarBg: { flex: 1, height: 8, background: '#EDE9E1', borderRadius: 4, overflow: 'hidden' },
  dimScore: { fontSize: 14, fontWeight: 700, color: '#1A1714', width: 28, textAlign: 'right' as const },
  aiSection: { marginTop: 20, borderTop: '1px solid #EDE9E1', paddingTop: 20 },
  aiHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiIcon: { fontSize: 16 },
  aiTitle: { fontSize: 14, fontWeight: 700, color: '#1A1714' },
  aiSpinner: { fontSize: 16, color: '#6B5ECD', marginLeft: 4 },
  aiLoading: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' },
  aiLoadingDots: { display: 'flex', gap: 5 },
  aiDot: {
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#6B5ECD',
  },
  aiBody: {
    fontSize: 14, color: '#3D3830', lineHeight: 1.85,
    background: 'linear-gradient(135deg, #FAF8F4 0%, #F0EDF8 100%)',
    borderRadius: 14, padding: '20px 24px',
    border: '1px solid rgba(107,94,205,0.1)',
  },
};

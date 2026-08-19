import React, { useMemo, useEffect, useState } from 'react';
import { METHODS, EMPTY_STATS } from '../data/seeds.js';
import { METHOD_LABELS as _ML, DIMENSION_LABELS as _DLABELS, ALL_DIMENSIONS } from '../data/schema.js';
// 扩展维度标签，兼容盲测新增 character/habit 维度
const DIMENSION_LABELS: Record<string, string> = { ..._DLABELS, character: '性格特质', habit: '日常习惯' };
// 只展示命盘综合实际产出的4个流派（与 Home.tsx 保持一致）
const ACTIVE_METHODS = ['bazi', 'huangli', 'xiaoliuren', 'zodiac'] as const;
type ActiveMethod = typeof ACTIVE_METHODS[number];
const METHOD_LABELS: Record<string, string> = { bazi: '八字', huangli: '黄历', xiaoliuren: '小六壬', zodiac: '星座' };
// ALL_METHODS 覆盖为只含4个
const ALL_METHODS = ACTIVE_METHODS as unknown as string[];
import type { Method, Dimension } from '../data/schema.js';
import { getVerifications, getUniqueUserCount, getStats, getBlindtestHistory } from '../data/store.js';

// ─── 颜色常量 ───
const C = {
  bg: '#FAF8F4', white: '#FFFFFF', stone: '#EDE9E1',
  purple: '#6B5ECD', lightPurple: '#EEE9FF',
  green: '#3D9970', lightGreen: '#E6F4EE',
  amber: '#C07A28', lightAmber: '#FDF3E3',
  rose: '#C05070', lightRose: '#FCEEF2',
  ink: '#1A1714', softInk: '#3D3830', paleInk: '#7A7268', ghostInk: '#B5AFA6',
  gold: '#D4A520', lightGold: '#FBF3D5',
};

// ─── 工具函数 ───
function heatBg(rate: number | null): string {
  if (rate === null) return C.stone;
  if (rate >= 0.70) return '#C6F0DA';
  if (rate >= 0.55) return '#FDF3E3';
  return '#FCEEF2';
}
function heatFg(rate: number | null): string {
  if (rate === null) return C.ghostInk;
  if (rate >= 0.70) return '#1B5E35';
  if (rate >= 0.55) return '#7A4A10';
  return '#8B1A2F';
}

function pearsonR(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
  const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return dx === 0 || dy === 0 ? null : num / (dx * dy);
}

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return { background: C.white, borderRadius: 20, padding: '24px 28px', marginBottom: 20, boxShadow: '0 2px 20px rgba(60,48,32,0.06)', border: '1px solid rgba(0,0,0,0.04)', ...extra };
}

// ─── 视图切换 Tab ───
type ViewKind = 'all' | 'mine';

function ViewTabs({ active, onChange }: { active: ViewKind; onChange: (v: ViewKind) => void }) {
  const tabs: { key: ViewKind; label: string }[] = [
    { key: 'all', label: '📊 全体统计' },
    { key: 'mine', label: '🧬 我的算法' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '10px 24px', borderRadius: 12, border: 'none',
            fontSize: 14, fontWeight: active === t.key ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.2s',
            background: active === t.key ? C.purple : C.stone,
            color: active === t.key ? '#fff' : C.softInk,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── 空状态组件 ───
function EmptyState() {
  return (
    <div style={es.wrap}>
      <div style={es.icon}>🧪</div>
      <h3 style={es.title}>暂无真实数据</h3>
      <p style={es.desc}>
        当前还没有盲测验证记录。<br />
        每完成一次盲测，你的数据就会实时更新到这里。<br />
        效力榜单的所有统计均来自真实用户的真实反馈，<strong>不使用任何虚拟数据</strong>。
      </p>
      <div style={es.hint}>
        → 前往「🎯 盲测实验」完成第一次盲测
      </div>
    </div>
  );
}

const es: Record<string, React.CSSProperties> = {
  wrap: { textAlign: 'center', padding: '64px 32px', background: C.white, borderRadius: 20, marginBottom: 24, boxShadow: '0 2px 20px rgba(60,48,32,0.06)' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 12 },
  desc: { fontSize: 15, color: C.paleInk, lineHeight: 1.8, marginBottom: 24 },
  hint: { display: 'inline-block', padding: '12px 24px', background: C.lightPurple, color: C.purple, borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

// ─── SVG 折线图（真实数据）───
function RealLineChart({ data }: { data: { date: string; rate: number }[] }) {
  if (data.length < 2) return (
    <div style={{ textAlign: 'center', padding: '32px', color: C.ghostInk, fontSize: 13 }}>
      至少需要 2 天数据才能显示趋势图
    </div>
  );

  const W = 680, H = 180, pad = { t: 16, r: 24, b: 36, l: 48 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * cw,
    y: pad.t + ch - d.rate * ch,
    d,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${pad.t + ch} L${pts[0].x},${pad.t + ch}Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {ticks.map(t => {
        const y = pad.t + ch - t * ch;
        return (
          <g key={t}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke={C.stone} strokeWidth="1" />
            <text x={pad.l - 6} y={y + 4} fontSize="11" fill={C.ghostInk} textAnchor="end">{Math.round(t * 100)}%</text>
          </g>
        );
      })}
      <path d={areaPath} fill="rgba(107,94,205,0.08)" />
      <path d={linePath} fill="none" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={C.purple} stroke={C.white} strokeWidth="2" />
          <text x={p.x} y={pad.t + ch + 18} fontSize="11" fill={C.ghostInk} textAnchor="middle">{p.d.date}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── AI 结论富文本渲染 ───
// AI 输出格式约定：
//   ## 小标题  → 紫色段落标题
//   💡 开头段  → 浅紫背景解释框
//   普通文本   → 正文，数字高亮

function highlightNumbers(text: string) {
  const parts = text.split(/(\d+\.?\d*%|r̄?=[\d.]+|n=\d+|p[<>≥≤][\d.]+(?:\s*\([^)]+\))?|假设[AB])/g);
  return parts.map((part, i) => {
    if (/\d+\.?\d*%/.test(part)) return <strong key={i} style={{ color: '#1B5E35', fontVariantNumeric: 'tabular-nums' as const }}>{part}</strong>;
    if (/r̄?=[\d.]+/.test(part)) return <strong key={i} style={{ color: '#6B5ECD', fontVariantNumeric: 'tabular-nums' as const }}>{part}</strong>;
    if (/n=\d+/.test(part)) return <strong key={i} style={{ color: '#C47A1E', fontVariantNumeric: 'tabular-nums' as const }}>{part}</strong>;
    if (/p[<>≥≤][\d.]+/.test(part)) return <em key={i} style={{ color: '#6B5ECD' }}>{part}</em>;
    if (/假设[AB]/.test(part)) return <strong key={i} style={{ color: '#C47A1E' }}>{part}</strong>;
    return <span key={i}>{part}</span>;
  });
}

function AiConclusionRenderer({ text }: { text: string }) {
  const lines = text.split(/[\n\r]+/).filter((p: string) => p.trim());

  const rendered = lines.map((line, idx) => {
    const trimmed = line.trim();

    // ## 小标题
    if (trimmed.startsWith('##')) {
      const title = trimmed.replace(/^#+\s*/, '');
      return (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: idx > 0 ? 8 : 0, marginBottom: 6 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: '#6B5ECD', flexShrink: 0 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6B5ECD', letterSpacing: 0.5 }}>{title}</div>
        </div>
      );
    }

    // 💡 解释框（以 💡 或 > 开头）
    if (trimmed.startsWith('💡') || trimmed.startsWith('>')) {
      const content = trimmed.replace(/^💡\s*|^>\s*/, '');
      return (
        <div key={idx} style={{
          background: 'rgba(107,94,205,0.08)', border: '1px solid rgba(107,94,205,0.18)',
          borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#5A4FBE', lineHeight: 1.8,
        }}>
          💡 {content}
        </div>
      );
    }

    // ⚠️ 警告框
    if (trimmed.startsWith('⚠️') || trimmed.startsWith('注意')) {
      const content = trimmed.replace(/^⚠️\s*|^注意[：:]?\s*/, '');
      return (
        <div key={idx} style={{
          background: 'rgba(196,122,30,0.08)', border: '1px solid rgba(196,122,30,0.2)',
          borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#8B5E10', lineHeight: 1.8,
        }}>
          ⚠️ {content}
        </div>
      );
    }

    // 里程碑列表（以数字+. 或 • 开头）
    if (/^[\d•\-]/.test(trimmed)) {
      return (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C47A1E', marginTop: 8, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#5A4B3A', lineHeight: 1.85, margin: 0 }}>
            {highlightNumbers(trimmed.replace(/^[\d•\-\.]+\s*/, ''))}
          </p>
        </div>
      );
    }

    // 普通正文
    return (
      <p key={idx} style={{ fontSize: 13, color: '#3C3020', lineHeight: 1.9, margin: 0 }}>
        {highlightNumbers(trimmed)}
      </p>
    );
  });

  return <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>{rendered}</div>;
}

// ─── 雷达图轮播（聚合 + 4流派）───
function RadarCarousel({ radarData, statsMap }: {
  radarData: { label: string; score: number }[];
  statsMap: Map<string, { n: number; hitRate: number; pearsonR: number | null }>;
}) {
  const [idx, setIdx] = React.useState(0);
  const startX = React.useRef(0);

  // 构建5张图数据
  const slides: { title: string; subtitle: string; color: string; data: { label: string; score: number }[] }[] = [
    {
      title: '所有流派聚合',
      subtitle: '所有流派在各维度命中率的加权平均',
      color: '#6B5ECD',
      data: radarData,
    },
    ...(['bazi', 'huangli', 'xiaoliuren', 'zodiac'] as const).map(method => {
      const labelMap: Record<string, string> = { bazi: '八字', huangli: '黄历', xiaoliuren: '小六壬', zodiac: '星座' };
      const colorMap: Record<string, string> = { bazi: '#C47A1E', huangli: '#1B5E35', xiaoliuren: '#6B5ECD', zodiac: '#D44A6E' };
      const dims = ['overall','career','wealth','love','health','emotion','interpersonal'] as const;
      const dimLabelMap: Record<string, string> = { overall:'整体', career:'事业', wealth:'财运', love:'感情', health:'健康', emotion:'情绪', interpersonal:'人际' };
      const data = dims.map(dim => {
        const st = statsMap.get(`${method}:${dim}`);
        return { label: dimLabelMap[dim], score: st && st.n > 0 ? st.hitRate : 0 };
      });
      const totalN = data.reduce((s, d) => {
        const st = statsMap.get(`${method}:${dims[data.indexOf(d)]}`);
        return s + (st?.n ?? 0);
      }, 0);
      return {
        title: labelMap[method],
        subtitle: `n=${totalN} 条验证记录`,
        color: colorMap[method],
        data,
      };
    }),
  ];

  const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) setIdx(i => dx < 0 ? Math.min(i + 1, slides.length - 1) : Math.max(i - 1, 0));
  };

  const slide = slides[idx];
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 16px', marginBottom: 16, boxShadow: '0 1px 4px rgba(60,48,32,0.06)' }} className="card-enter">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1714', margin: 0 }}>📡 各维度命中率雷达</h2>
          <p style={{ fontSize: 12, color: '#A8978A', margin: '4px 0 0' }}>左右滑动查看各流派独立视角</p>
        </div>
        {/* 分页点 */}
        <div style={{ display: 'flex', gap: 5, paddingTop: 4 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
              background: i === idx ? slide.color : '#E5DDD5',
              transition: 'all 0.3s ease', cursor: 'pointer',
            }} />
          ))}
        </div>
      </div>

      {/* 当前图 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ userSelect: 'none' as const }}
      >
        <div style={{ textAlign: 'center' as const, marginBottom: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: slide.color }}>{slide.title}</div>
          <div style={{ fontSize: 11, color: '#A8978A', marginBottom: 4 }}>{slide.subtitle}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RealRadarChart data={slide.data} color={slide.color} />
        </div>
      </div>

      {/* 左右箭头（桌面端） */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <button onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}
          style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer',
            fontSize: 18, color: idx === 0 ? '#E5DDD5' : '#6B5ECD', padding: '4px 8px' }}>‹</button>
        <span style={{ fontSize: 11, color: '#A8978A', alignSelf: 'center' }}>{idx + 1} / {slides.length}</span>
        <button onClick={() => setIdx(i => Math.min(i + 1, slides.length - 1))} disabled={idx === slides.length - 1}
          style={{ border: 'none', background: 'none', cursor: idx === slides.length - 1 ? 'default' : 'pointer',
            fontSize: 18, color: idx === slides.length - 1 ? '#E5DDD5' : '#6B5ECD', padding: '4px 8px' }}>›</button>
      </div>
    </div>
  );
}

// ─── SVG 雷达图（真实数据）───
function RealRadarChart({ data, color = '#6B5ECD' }: { data: { label: string; score: number }[]; color?: string }) {
  const W = 420, H = 340;
  const cx = W / 2, cy = H / 2, R = 120;
  const n = data.length;
  if (n === 0) return null;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const rings = [0.25, 0.5, 0.75, 1.0];
  const ringPoly = (r: number) =>
    Array.from({ length: n }, (_, i) =>
      `${cx + R * r * Math.cos(angle(i))},${cy + R * r * Math.sin(angle(i))}`
    ).join(' ');

  const dataPoly = data.map((d, i) =>
    `${cx + R * d.score * Math.cos(angle(i))},${cy + R * d.score * Math.sin(angle(i))}`
  ).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {rings.map((r, ri) => (
        <polygon key={ri} points={ringPoly(r)} fill="none"
          stroke={ri === rings.length - 1 ? '#D5D0C8' : C.stone} strokeWidth="1" />
      ))}
      {data.map((_, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + R * Math.cos(angle(i))} y2={cy + R * Math.sin(angle(i))}
          stroke={C.stone} strokeWidth="1" />
      ))}
      <polygon points={dataPoly} fill="rgba(107,94,205,0.12)" stroke={color} strokeWidth="2" />
      {data.map((d, i) => {
        const lx = cx + (R + 24) * Math.cos(angle(i));
        const ly = cy + (R + 24) * Math.sin(angle(i));
        const anchor = lx < cx - 4 ? 'end' : lx > cx + 4 ? 'start' : 'middle';
        return (
          <text key={i} x={lx} y={ly + 4} fontSize="12" fill={C.softInk}
            fontWeight="600" textAnchor={anchor}>
            {d.label}
          </text>
        );
      })}
      {rings.map((r, ri) => (
        <text key={ri} x={cx + 4} y={cy - R * r + 4} fontSize="9" fill={C.ghostInk}>
          {Math.round(r * 100)}%
        </text>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════
//  视图 A：全体统计
// ═══════════════════════════════════════

function pText(r: number | null, n: number): string {
  if (r === null || n < 7) return '—';
  if (n < 30) return 'p>0.2';
  if (Math.abs(r) < 0.10) return 'p>0.2';
  if (Math.abs(r) < 0.15) return 'p≈0.15';
  if (Math.abs(r) < 0.20) return 'p≈0.10';
  return 'p<0.05';
}

// conclusionText 已废弃，改为 AI 动态生成（见 ExperimentStatus 内的 useEffect）


function ExperimentStatus({ totalN, avgHitRate, avgR, blindtestCount, overallStats, hasData }: {
  totalN: number; avgHitRate: number; avgR: number | null;
  blindtestCount: number; overallStats: { method: Method; n: number; hitRate: number; pearsonR: number | null }[];
  hasData: boolean;
}) {
  // 进度条用参与用户数 blindtestCount，不用验证记录数
  const n = blindtestCount;
  const conf = n < 7 ? { label: '数据不足', color: C.rose, bar: 4 }
    : n < 30 ? { label: '低置信', color: C.amber, bar: 20 }
    : n < 100 ? { label: '初步可参考', color: C.amber, bar: 50 }
    : n < 500 ? { label: '较高置信', color: C.green, bar: 80 }
    : { label: '高置信', color: '#1B5E35', bar: 100 };
  const progressPct = Math.min((n / 600) * 100, 100);

  // AI 动态生成结论
  const [aiConclusion, setAiConclusion] = React.useState<string>('');
  const [conclusionLoading, setConclusionLoading] = React.useState(false);
  const prevKey = React.useRef('');

  React.useEffect(() => {
    if (!hasData) return;
    const key = `${n}_${avgHitRate.toFixed(3)}_${avgR?.toFixed(3)}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    const cached = localStorage.getItem(`fatelab3_conclusion_${key}`);
    if (cached) { setAiConclusion(cached); return; }

    setConclusionLoading(true);
    const topMethod = overallStats[0];
    const botMethod = overallStats[overallStats.length - 1];
    const methodDetail = overallStats.map(s =>
      `${METHOD_LABELS[s.method as Method]}：命中率${(s.hitRate*100).toFixed(1)}%，n=${s.n}，r=${s.pearsonR?.toFixed(3) ?? '—'}`
    ).join('；');

    import('../lib/llm.js').then(({ chat }) => {
      chat([
        { role: 'system', content: `你是一名经济学统计学者，请基于真实实验数据撰写实验报告。

**输出格式规范（必须严格遵守）：**
1. 用 ## 开头写三个小标题：## 当前统计发现、## 数据局限性、## 后续实验规划
2. 每个小标题下写 1-2 段正文，先用专业语言描述，再用 💡 开头写一句通俗解释
3. 后续实验规划用 • 列表格式写三个里程碑（n=30/100/300）
4. 数字精确，总字数不超过 350 字
5. 不要出现 Markdown 粗体（**）` },
        { role: 'user', content: `实验数据如下：
- 参与用户数 n=${n}，验证记录总数=${totalN}
- 整体命中率=${(avgHitRate*100).toFixed(1)}%，Pearson r̄=${avgR?.toFixed(3) ?? '—'}
- 各流派详情：${methodDetail}
- 命中率最高：${topMethod ? METHOD_LABELS[topMethod.method as Method] + '（' + (topMethod.hitRate*100).toFixed(1) + '%）' : '—'}
- 命中率最低：${botMethod ? METHOD_LABELS[botMethod.method as Method] + '（' + (botMethod.hitRate*100).toFixed(1) + '%）' : '—'}

请严格按格式输出，使用真实的n=${n}，不要虚构数据。` },
      ], 4000).then(result => {
        if (result) {
          setAiConclusion(result);
          localStorage.setItem(`fatelab3_conclusion_${key}`, result);
        }
        setConclusionLoading(false);
      }).catch(() => setConclusionLoading(false));
    });
  }, [n, hasData]);

  return (
    <div style={cardStyle()} className="card-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🧪 实验进展</h2>
          <p style={{ fontSize: 12, color: C.ghostInk }}>全平台用户数据实时汇总 · 基于经济学回归分析统计 · 每次盲测完成后自动更新</p>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, color: '#fff', flexShrink: 0, background: conf.color }}>{conf.label}</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 8, background: C.stone, borderRadius: 4, position: 'relative', marginBottom: 22 }}>
          <div style={{ height: '100%', borderRadius: 4, transition: 'width 1s ease', width: `${progressPct}%`, background: conf.color }} />
          {[
            { n: 7, label: 'n=7' },
            { n: 30, label: 'n=30' },
            { n: 100, label: 'n=100' },
            { n: 500, label: 'n=500' },
          ].map(({ n: mn, label }) => {
            const pct = Math.min((mn / 600) * 100, 100);
            return (
              <div key={mn} style={{ position: 'absolute', left: `${pct}%`, top: 0, transform: 'translateX(-50%)' }}>
                <div style={{ width: 1, height: 8, background: 'rgba(60,48,32,0.2)', margin: '0 auto' }} />
                <div style={{ fontSize: 9, color: 'rgba(60,48,32,0.35)', whiteSpace: 'nowrap', textAlign: 'center', marginTop: 2 }}>{label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.ghostInk, marginTop: 4 }}>
          <span>数据不足</span><span>参考值</span><span>初步分析</span><span>较高置信</span><span>统计显著</span>
        </div>
      </div>

      <div style={{ background: C.bg, borderRadius: 12, padding: '20px 22px', marginBottom: 20, border: `1px solid ${C.stone}`, minHeight: 80 }}>
        {conclusionLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: C.purple,
                  animation: 'pulse 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`, opacity: 0.7
                }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: C.ghostInk }}>AI 正在基于真实统计数据生成实验结论…</span>
          </div>
        ) : aiConclusion ? (
          <AiConclusionRenderer text={aiConclusion} />
        ) : !hasData ? (
          <p style={{ fontSize: 13, color: C.ghostInk, lineHeight: 1.8, margin: 0 }}>实验尚无真实验证数据。完成盲测实验后，本区域将显示基于用户真实反馈计算的统计检验结论。</p>
        ) : (
          <p style={{ fontSize: 13, color: C.ghostInk, margin: 0 }}>正在加载实验结论…</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: '参与用户数 n', val: hasData ? blindtestCount : '—', sub: '已完成盲测的用户次数' },
          { label: '整体命中率', val: hasData && totalN >= 7 ? `${(avgHitRate * 100).toFixed(1)}%` : '—', sub: 'AI 打分 ≥60 计命中' },
          { label: 'Pearson r̄', val: hasData && avgR !== null ? avgR.toFixed(3) : '—', sub: '预测序列 vs 真实序列' },
          { label: '盲测总次数 t', val: blindtestCount, sub: '所有用户参与盲测总计' },
        ].map(m => (
          <div key={m.label} style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid C.stone' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>{m.val}</div>
            <div style={{ fontSize: 12, color: C.paleInk, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: C.ghostInk }}>{m.sub}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ═══════════════════════════════════════
//  视图 B：我的算法
// ═══════════════════════════════════════

interface MyAlgoData {
  history: ReturnType<typeof getBlindtestHistory>;
  verifications: ReturnType<typeof getVerifications>;
}

/**
 * 通过盲测 history 的 submittedAt + questions.source 匹配 verifications
 * 来构建个人维度和流派分数映射。
 */
function useMyAlgoData(tick: number): MyAlgoData {
  const history = useMemo(() => getBlindtestHistory(), [tick]);
  const verifications = useMemo(() => getVerifications(), [tick]);
  return { history, verifications };
}

/** 从盲测 history 计算每个流派+维度的平均 llmScore */
function computePersonalScores(history: MyAlgoData['history'], verifications: MyAlgoData['verifications']) {
  // 用 submittedAt 做时间匹配：把 verification 按日期分组
  const vByDate: Record<string, { llmScore: number; dimension: Dimension }[]> = {};
  for (const v of verifications) {
    const d = v.createdAt?.split('T')[0] ?? '';
    if (!d) continue;
    if (!vByDate[d]) vByDate[d] = [];
    vByDate[d].push({ llmScore: v.llmScore, dimension: v.dimension });
  }

  // 按流派+维度聚合
  const comboMap: Record<string, { scores: number[]; source: string; dimension: Dimension }> = {};
  for (const entry of history) {
    const day = entry.submittedAt?.split('T')[0] ?? '';
    const dayVs = vByDate[day] ?? [];
    // 每个问题的 source 对应流派，dimension 对应维度
    for (const q of entry.questions) {
      const src = q.source;
      const dim = q.dimension;
      if (!src || !dim) continue;
      const key = `${src}:${dim}`;
      if (!comboMap[key]) comboMap[key] = { scores: [], source: src, dimension: dim };
      // 匹配当天的 verification 中对应维度的 llmScore
      const matching = dayVs.find(v => v.dimension === dim);
      if (matching) {
        comboMap[key].scores.push(matching.llmScore);
      }
    }
  }

  const bySource: Record<string, number[]> = {};
  const byDimension: Record<string, number[]> = {};
  const comboAvg: { source: string; dimension: Dimension; avg: number; count: number }[] = [];

  for (const [key, val] of Object.entries(comboMap)) {
    if (val.scores.length === 0) continue;
    const avg = val.scores.reduce((a, b) => a + b, 0) / val.scores.length;
    comboAvg.push({ source: val.source, dimension: val.dimension, avg, count: val.scores.length });

    if (!bySource[val.source]) bySource[val.source] = [];
    bySource[val.source].push(...val.scores);

    if (!byDimension[val.dimension]) byDimension[val.dimension] = [];
    byDimension[val.dimension].push(...val.scores);
  }

  const sourceAvg = Object.entries(bySource).map(([source, scores]) => ({
    source,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    count: scores.length,
  })).sort((a, b) => b.avg - a.avg);

  const dimAvg = Object.entries(byDimension).map(([dimension, scores]) => ({
    dimension: dimension as Dimension,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    count: scores.length,
  }));

  // 按日期聚合最近 10 次盲测的平均分
  const byDay: Record<string, number[]> = {};
  for (const entry of history) {
    const day = entry.submittedAt?.split('T')[0] ?? '';
    if (!day) continue;
    const dayVs = vByDate[day] ?? [];
    if (dayVs.length > 0) {
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(...dayVs.map(v => v.llmScore));
    }
  }

  const trendData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([date, scores]) => ({
      date: new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      rate: scores.reduce((a, b) => a + b, 0) / scores.length / 100,
    }));

  return { sourceAvg, dimAvg, comboAvg, trendData };
}

/** 维度热力图颜色 */
function dimHeatColor(score: number): string {
  if (score >= 70) return C.lightGreen;
  if (score >= 55) return C.lightAmber;
  return C.lightRose;
}
function dimHeatFg(score: number): string {
  if (score >= 70) return '#1B5E35';
  if (score >= 55) return '#7A4A10';
  return '#8B1A2F';
}

function PersonalAlgorithmView({ history, verifications }: MyAlgoData) {
  const blindtestCount = history.length;
  const firstDate = history.length > 0
    ? new Date(history[history.length - 1]?.submittedAt ?? Date.now())
    : new Date();
  const lastDate = history.length > 0
    ? new Date(history[0]?.submittedAt ?? Date.now())
    : new Date();
  const daysSpan = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / 86400000));

  // 解锁判定
  const unlockLevel = blindtestCount === 0 ? 'none'
    : blindtestCount < 7 ? 'progress'
    : blindtestCount < 15 ? '7day'
    : blindtestCount < 30 ? '15day'
    : '30day';

  // 不足 7 次：进度引导
  if (blindtestCount === 0) {
    return (
      <div style={cardStyle()}>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧬</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>完成首次盲测后解锁个人分析</h3>
          <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.8 }}>
            「我的算法」面板基于你的历史盲测数据，<br />
            为你提纯出最适合你的算命方式和维度。<br />
            完成第一次盲测后即可开始积累。
          </p>
          <div style={{ marginTop: 20, display: 'inline-block', padding: '12px 28px', background: C.lightPurple, color: C.purple, borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
            → 前往「🎯 盲测实验」开始
          </div>
        </div>
      </div>
    );
  }

  // 计算个人数据（只要有1次即显示）
  const { sourceAvg, dimAvg, comboAvg, trendData } = computePersonalScores(history, verifications);

  const topSource = sourceAvg.length > 0 ? sourceAvg[0] : null;
  // 每个维度只保留命中率最高的那个流派
  const topComboRaw = comboAvg.filter(c => c.avg >= 70).sort((a, b) => b.avg - a.avg);
  const topCombo = (() => {
    const seen = new Set<string>();
    return topComboRaw.filter(c => {
      if (seen.has(c.dimension)) return false;
      seen.add(c.dimension);
      return true;
    });
  })();

  // 最准维度
  const topDim = dimAvg.length > 0 ? dimAvg.sort((a, b) => b.avg - a.avg)[0] : null;

  return (
    <div>
      {/* 顶部概览 */}
      <div style={cardStyle({ marginBottom: 20 })}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>🧬</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
            你已完成 {blindtestCount} 次盲测 · 实验持续 {daysSpan} 天
          </span>
        </div>
        <div style={{ fontSize: 12, color: C.paleInk, marginTop: 4, lineHeight: 1.7 }}>
          💡 参与次数越多、覆盖日期越多，统计结论的置信度越高。建议尽可能多地参与盲测——每天一次，坚持 7 天以上可获得初步个人算法分析；30 天以上数据才具备较高统计效力。
        </div>
      </div>

      {/* 最适合你的算命方式 */}
      {topSource && (
        <div style={cardStyle({ marginBottom: 20 })}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🎯 最适合你的算命方式</h3>
          <p style={{ fontSize: 12, color: C.paleInk, marginBottom: 16 }}>
            根据你的 {sourceAvg.reduce((s, x) => s + x.count, 0)} 条盲测记录分析
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sourceAvg.map((s, i) => {
              const meta = METHODS.find(m => m.id === s.source as Method);
              const isTop = i === 0;
              const pct = (s.avg / 100).toFixed(1);
              return (
                <div key={s.source} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: isTop ? '12px 16px' : '10px 14px',
                  borderRadius: isTop ? 12 : 10,
                  background: isTop ? C.lightGold : C.bg,
                  border: isTop ? `1px solid ${C.gold}` : '1px solid transparent',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, width: 22, flexShrink: 0, color: isTop ? C.gold : C.ghostInk }}>
                    #{i + 1}
                  </span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta?.color ?? '#ccc', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: isTop ? 700 : 600, color: isTop ? C.gold : C.ink, width: 64, flexShrink: 0 }}>
                    {METHOD_LABELS[s.source as Method] ?? s.source}
                  </span>
                  <div style={{ flex: 1, height: 6, background: C.stone, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: isTop ? C.gold : (meta?.color ?? C.purple), width: `${s.avg}%`, transition: 'width 0.8s ease' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isTop ? C.gold : C.ink, width: 44, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  <span style={{ fontSize: 11, color: C.ghostInk, width: 40, textAlign: 'right', flexShrink: 0 }}>n={s.count}</span>
                </div>
              );
            })}
          </div>
          {topSource && (
            <p style={{ fontSize: 13, color: C.softInk, marginTop: 14, marginBottom: 0, lineHeight: 1.7 }}>
              🏆 根据你的 {sourceAvg.reduce((s, x) => s + x.count, 0)} 条盲测记录，
              <strong style={{ color: C.gold }}>{METHOD_LABELS[topSource.source as Method]}</strong> 对你的预测准确度最高（
              <strong style={{ color: C.gold }}>{(topSource.avg).toFixed(1)}%</strong>），建议重点参考
            </p>
          )}
        </div>
      )}

      {/* 维度热力图 */}
      {dimAvg.length > 0 && (
        <div style={cardStyle({ marginBottom: 20 })}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 12 }}>🔥 你的维度热力图</h3>
          <p style={{ fontSize: 12, color: C.paleInk, marginBottom: 16 }}>各维度的平均预测准确度，颜色区分高中低</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {ALL_DIMENSIONS.map(dim => {
              const found = dimAvg.find(d => d.dimension === dim);
              const score = found ? found.avg : 0;
              return (
                <div key={dim} style={{
                  padding: '14px 20px', borderRadius: 12, textAlign: 'center',
                  background: found ? dimHeatColor(score) : C.stone,
                  color: found ? dimHeatFg(score) : C.ghostInk,
                  minWidth: 80, flex: '1 0 auto',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{DIMENSION_LABELS[dim]}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {found ? `${score.toFixed(0)}%` : '—'}
                  </div>
                  {found && <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>n={found.count}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.ghostInk, marginTop: 12 }}>
            颜色说明：<span style={{ color: '#1B5E35' }}>■</span> ≥70% 高 · <span style={{ color: '#7A4A10' }}>■</span> 55-70% 中 · <span style={{ color: '#8B1A2F' }}>■</span> &lt;55% 低 · <span style={{ color: C.ghostInk }}>■</span> 无数据
          </div>
        </div>
      )}

      {/* 个人算法提纯 */}
      <div style={cardStyle({ marginBottom: 20 })}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 12 }}>🧪 个人算法提纯</h3>
        {topCombo.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topCombo
              .filter(c => c.source && METHOD_LABELS[c.source] && DIMENSION_LABELS[c.dimension])
              .map((c) => (
              <div key={`${c.source}:${c.dimension}`} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, background: C.lightGold,
                border: '1px solid rgba(212,165,32,0.2)',
              }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <span style={{ fontSize: 13, color: C.softInk, lineHeight: 1.6 }}>
                  你的专属算法：<strong style={{ color: C.gold }}>{METHOD_LABELS[c.source]}</strong> 对你的
                  <strong style={{ color: C.gold }}>「{DIMENSION_LABELS[c.dimension]}」</strong> 预测准确度达
                  <strong style={{ color: C.gold }}> {c.avg.toFixed(1)}%</strong>，显著优于平均
                  <span style={{ fontSize: 11, color: C.ghostInk, marginLeft: 8 }}>（n={c.count}）</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: C.paleInk, fontSize: 13 }}>
            继续积累数据，个人算法正在形成中…<br />
            <span style={{ fontSize: 12, color: C.ghostInk }}>当某流派+维度的准确度 ≥70 分时将自动在此展示</span>
          </div>
        )}
      </div>

      {/* ── Skill 生成进度卡（基于不同日期数量）── */}
      {(() => {
        const distinctDays = new Set(history.map(h => h.submittedAt?.split('T')[0]).filter(Boolean)).size;
        const TARGET_DAYS = 7;
        const pct = Math.min(100, (distinctDays / TARGET_DAYS) * 100);
        const locked = distinctDays < TARGET_DAYS;
        const need = TARGET_DAYS - distinctDays;
        return (
          <div style={cardStyle({ marginBottom: 20, border: '1px solid rgba(107,94,205,0.2)', background: C.lightPurple })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>🧬</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.purple }}>个人专属 Skill 生成</div>
                <div style={{ fontSize: 12, color: C.paleInk, marginTop: 2 }}>需在 <strong>7 个不同日期</strong> 各完成一次盲测，才能生成具备置信度的个人算法 Skill</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: locked ? C.paleInk : C.gold, fontWeight: 600 }}>
                {locked ? `🔒 个人 Skill 生成中…` : '✅ 个人专属 Skill 已解锁'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: locked ? C.purple : C.gold }}>{distinctDays} / {TARGET_DAYS} 天</span>
            </div>

            <div style={{ height: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', borderRadius: 5, background: locked ? C.purple : C.gold, width: pct + '%', transition: 'width 0.6s ease' }} />
            </div>

            {locked ? (
              <div style={{ fontSize: 12, color: C.paleInk, lineHeight: 1.7 }}>
                已在 <strong style={{ color: C.purple }}>{distinctDays}</strong> 个不同日期完成盲测，
                还需 <strong style={{ color: C.purple }}>{need}</strong> 个不同日期的测试数据。
                每天做一次，连续测试 7 天后，系统将自动提纯你的专属算法。
              </div>
            ) : (
              <div style={{ fontSize: 12, color: C.softInk, lineHeight: 1.7, padding: '10px 14px', background: C.lightGold, borderRadius: 8, border: '1px solid rgba(212,165,32,0.2)' }}>
                ✨ 已积累 <strong style={{ color: C.gold }}>{distinctDays} 天</strong>的测试数据！
                你的个人算法已具备初步统计意义，参见上方「个人算法提纯」模块。
                持续参与将进一步提升准确度。
              </div>
            )}

            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.6)', borderRadius: 10, fontSize: 12, color: C.paleInk, lineHeight: 1.7 }}>
              💡 <strong>为什么要 7 个不同日期？</strong> 算命预测的维度（事业/感情/健康等）会随日期变化，
              只有跨越多个日期的采样，才能消除单日偶然性，使「流派 × 维度」的准确度统计具备真正的参考价值。
            </div>
          </div>
        );
      })()}

      {/* 近期趋势 */}
      {trendData.length >= 2 && (
        <div style={cardStyle({ marginBottom: 20 })}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>📈 近期趋势</h3>
          <p style={{ fontSize: 12, color: C.paleInk, marginBottom: 12 }}>最近 {trendData.length} 次盲测的平均准确度变化</p>
          <RealLineChart data={trendData} />
        </div>
      )}

      {/* 本周推荐 */}
      {topSource && topDim && (
        <div style={cardStyle({ marginBottom: 20, background: C.lightPurple, border: '1px solid rgba(107,94,205,0.15)' })}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.purple, marginBottom: 8 }}>📌 本周推荐</h3>
          <p style={{ fontSize: 14, color: C.softInk, lineHeight: 1.8, margin: 0 }}>
            本周重点参考 <strong style={{ color: C.purple }}>{METHOD_LABELS[topSource.source as Method]}</strong>，
            尤其是 <strong style={{ color: C.purple }}>「{DIMENSION_LABELS[topDim.dimension]}」</strong> 维度
            （准确度 {topDim.avg.toFixed(1)}%）
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
//  主组件
// ═══════════════════════════════════════

export default function Rankings() {
  const [tick, setTick] = useState(0);
  const [view, setView] = useState<ViewKind>('all');

  useEffect(() => {
    const h = () => setTick(t => t + 1);
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  // ── 全局数据 ──
  const verifications = useMemo(() => getVerifications(), [tick]);
  const storedStats = useMemo(() => getStats(), [tick]);
  const uniqueUsers = useMemo(() => getUniqueUserCount(), [tick]);
  const blindtestHist = useMemo(() => getBlindtestHistory(), [tick]);
  const hasData = verifications.length > 0;

  // ── statsMap ──
  const statsMap = useMemo(() => {
    const map = new Map<string, typeof EMPTY_STATS[number]>();
    for (const s of EMPTY_STATS) map.set(`${s.method}:${s.dimension}`, { ...s, n: 0, hitRate: 0, pearsonR: null });
    // 确保4个活跃流派的所有维度都有初始记录
    for (const method of ALL_METHODS) {
      for (const dim of ALL_DIMENSIONS) {
        const key = `${method}:${dim}`;
        if (!map.has(key)) {
          const base = EMPTY_STATS[0];
          map.set(key, { ...base, method: method as import('../data/schema.js').Method, dimension: dim as import('../data/schema.js').Dimension, n: 0, hitRate: 0, pearsonR: null });
        }
      }
    }
    for (const s of storedStats) map.set(`${s.method}:${s.dimension}`, s);

    const verMap: Record<string, { scores: number[]; actuals: number[] }> = {};
    for (const v of verifications) {
      const methodKey = v.predictionId?.split('_')[0] as Method;
      const key = `${methodKey}:${v.dimension}`;
      if (!verMap[key]) verMap[key] = { scores: [], actuals: [] };
      verMap[key].scores.push(v.llmScore);
      verMap[key].actuals.push(v.llmScore >= 60 ? 1 : 0);
    }
    for (const [k, val] of Object.entries(verMap)) {
      if (val.scores.length === 0) continue;
      const hitRate = val.actuals.filter(Boolean).length / val.actuals.length;
      const r = pearsonR(val.scores.map(s => s / 100), val.actuals);
      const existing = map.get(k);
      if (existing) map.set(k, { ...existing, n: val.scores.length, hitRate, pearsonR: r });
    }
    return map;
  }, [storedStats, verifications]);

  // ── 各流派整体统计 ──
  const overallStats = useMemo(() => {
    return ALL_METHODS.map(method => {
      const SAFE = { n: 0, hitRate: 0, pearsonR: null };
      const dims = ALL_DIMENSIONS.map(d => statsMap.get(`${method}:${d}`) ?? SAFE);
      const totalN = dims.reduce((s, d) => s + (d.n ?? 0), 0);
      const avgHit = totalN > 0 ? dims.reduce((s, d) => s + (d.hitRate ?? 0) * (d.n ?? 0), 0) / totalN : 0;
      const allScores = verifications.filter(v => v.predictionId?.startsWith(method as string)).map(v => v.llmScore / 100);
      const allActuals = verifications.filter(v => v.predictionId?.startsWith(method as string)).map(v => v.llmScore >= 60 ? 1 : 0);
      const r = pearsonR(allScores, allActuals);
      return { method: method as import('../data/schema.js').Method, n: totalN, hitRate: avgHit, pearsonR: r };
    }).sort((a, b) => b.hitRate - a.hitRate);
  }, [statsMap, verifications]);

  const totalN = overallStats.reduce((s, o) => s + o.n, 0);
  const avgHitRate = totalN > 0 ? overallStats.reduce((s, o) => s + o.hitRate * o.n, 0) / totalN : 0;
  const validRs = overallStats.filter(o => o.pearsonR !== null).map(o => o.pearsonR as number);
  const avgR = validRs.length > 0 ? validRs.reduce((a, b) => a + b, 0) / validRs.length : null;

  // ── 折线图数据 ──
  const lineData = useMemo(() => {
    if (!hasData) return [];
    const byDate: Record<string, { hit: number; total: number }> = {};
    for (const v of verifications) {
      const d = v.createdAt?.split('T')[0] ?? '';
      if (!d) continue;
      if (!byDate[d]) byDate[d] = { hit: 0, total: 0 };
      byDate[d].total++;
      if (v.llmScore >= 60) byDate[d].hit++;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b)).slice(-14)
      .map(([date, { hit, total }]) => ({
        date: new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        rate: total > 0 ? hit / total : 0,
      }));
  }, [verifications]);

  // ── 雷达图数据 ──
  const radarData = useMemo(() => {
    if (!hasData) return [];
    return ALL_DIMENSIONS.map(dim => {
      const allN = ALL_METHODS.reduce((s, m) => s + (statsMap.get(`${m}:${dim}`)?.n ?? 0), 0);
      const allHit = ALL_METHODS.reduce((s, m) => {
        const st = statsMap.get(`${m}:${dim}`);
        return s + (st ? st.hitRate * st.n : 0);
      }, 0);
      return { label: DIMENSION_LABELS[dim], score: allN > 0 ? allHit / allN : 0 };
    });
  }, [statsMap, hasData]);

  // ── 个人数据 ──
  const myAlgoData = useMyAlgoData(tick);

  return (
    <div>
      <ViewTabs active={view} onChange={setView} />

      {view === 'all' ? (
        <>
          <ExperimentStatus
            totalN={totalN} avgHitRate={avgHitRate} avgR={avgR}
            blindtestCount={blindtestHist.length}
            overallStats={overallStats} hasData={hasData}
          />

          {!hasData ? (
            <EmptyState />
          ) : (
            <>
              {/* 效力总览已并入实验进展卡，此处不再重复 */}

              {/* 总榜条形图 */}
              <div style={cardStyle()} className="card-enter">
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>流派命中率总榜</h2>
                <p style={{ fontSize: 13, color: C.paleInk, marginBottom: 16, lineHeight: 1.6 }}>
                  命中率 = 该流派被盲测验证且 AI 语义匹配得分 ≥60 的比例，基于 n={totalN} 条真实数据计算。
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {overallStats.map((s, i) => {
                    const meta = METHODS.find(m => m.id === s.method);
                    const color = meta?.color ?? C.purple;
                    const confLabel = s.n < 7 ? '不足' : s.n < 30 ? '参考' : '可信';
                    const confColor = s.n < 7 ? C.ghostInk : s.n < 30 ? C.amber : C.green;
                    return (
                      <div key={s.method} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, width: 24, flexShrink: 0, color: i < 3 ? C.gold : C.ghostInk }}>#{i + 1}</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, width: 64, flexShrink: 0 }}>{METHOD_LABELS[s.method as Method]}</span>
                        <div style={{ flex: 1, height: 8, background: C.stone, borderRadius: 4, overflow: 'hidden' }}>
                          {s.n > 0 ? (
                            <div style={{ height: '100%', borderRadius: 3, background: color, width: `${s.hitRate * 100}%`, transition: 'width 1s ease' }} />
                          ) : (
                            <div style={{ height: '100%', background: C.stone, borderRadius: 3 }} />
                          )}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, width: 44, textAlign: 'right', flexShrink: 0 }}>{s.n > 0 ? `${(s.hitRate * 100).toFixed(1)}%` : '—'}</span>
                        <span style={{ fontSize: 11, color: C.ghostInk, width: 36, textAlign: 'right', flexShrink: 0 }}>n={s.n}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, width: 28, textAlign: 'right', flexShrink: 0, color: confColor }}>{confLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 折线图 */}
              {lineData.length >= 2 && (
                <div style={cardStyle()} className="card-enter">
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>每日命中率趋势（近 14 天）</h2>
                  <p style={{ fontSize: 13, color: C.paleInk, marginBottom: 16, lineHeight: 1.6 }}>每天盲测验证结果的当日命中率，反映近期玄学预测的整体准确性波动。</p>
                  <RealLineChart data={lineData} />
                </div>
              )}

              {/* 雷达图轮播：聚合 + 4流派 */}
              {radarData.length > 0 && (
                <RadarCarousel radarData={radarData} statsMap={statsMap} />
              )}

              {/* 热力图 */}
              <div style={cardStyle()} className="card-enter">
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>维度 × 流派热力图</h2>
                <p style={{ fontSize: 13, color: C.paleInk, marginBottom: 16, lineHeight: 1.6 }}>行 = 流派，列 = 维度。颜色越绿表示命中率越高，越红表示越低，灰色表示暂无该组合数据。</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4 }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: 11, fontWeight: 600, color: C.paleInk, padding: '6px 4px', textAlign: 'center', whiteSpace: 'nowrap' }} />
                        {ALL_DIMENSIONS.map(d => (
                          <th key={d} style={{ fontSize: 11, fontWeight: 600, color: C.paleInk, padding: '6px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>{DIMENSION_LABELS[d]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_METHODS.map(method => {
                        const meta = METHODS.find(m => m.id === method);
                        return (
                          <tr key={method}>
                            <td style={{ fontSize: 12, fontWeight: 600, color: C.ink, padding: '6px 12px 6px 4px', whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: meta?.color ?? '#ccc', marginRight: 6 }} />
                              {METHOD_LABELS[method as Method]}
                            </td>
                            {ALL_DIMENSIONS.map(dim => {
                              const stat = statsMap.get(`${method}:${dim}`);
                              const rate = stat && stat.n > 0 ? stat.hitRate : null;
                              return (
                                <td key={dim} style={{
                                  fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '8px 6px', borderRadius: 6, whiteSpace: 'nowrap',
                                  background: heatBg(rate),
                                  color: heatFg(rate),
                                }}>
                                  {rate !== null ? `${(rate * 100).toFixed(0)}%` : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: 11, color: C.ghostInk, marginTop: 12 }}>
                  颜色说明：<span style={{ color: '#1B5E35' }}>■</span> ≥70% · <span style={{ color: '#7A4A10' }}>■</span> 55-70% · <span style={{ color: '#8B1A2F' }}>■</span> &lt;55% · <span style={{ color: C.ghostInk }}>■</span> 无数据
                </p>
              </div>
            </>
          )}
        </>
      ) : (
        <PersonalAlgorithmView {...myAlgoData} />
      )}
    </div>
  );
}

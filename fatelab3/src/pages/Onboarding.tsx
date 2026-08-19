import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const C = {
  bg: '#FAF8F4', stone: '#EDE9E1', mist: '#F5F3EF',
  purple: '#6B5ECD', lightPurple: '#EEE9FF',
  green: '#3D9970', lightGreen: '#E6F4EE',
  amber: '#C07A28', lightAmber: '#FDF3E3',
  rose: '#C05070', lightRose: '#FCEEF2',
  gold: '#D4A520', lightGold: '#FBF3D5',
  ink: '#1A1714', softInk: '#3D3830', paleInk: '#7A7268', ghostInk: '#B5AFA6',
  white: '#FFFFFF',
};

const barData = [
  { label: '八字', pct: 73, color: C.purple },
  { label: '西洋占星', pct: 71, color: C.amber },
  { label: '黄历', pct: 68, color: C.green },
  { label: '紫微斗数', pct: 65, color: C.rose },
  { label: '小六壬', pct: 61, color: '#9B8FD0' },
  { label: '塔罗', pct: 48, color: '#C5BFBA' },
];

const heatRows = ['八字', '占星', '黄历'];
const heatCols = ['整体', '事业', '感情', '健康'];
const heatData: number[][] = [
  [73, 68, 71, 52],
  [71, 64, 58, 45],
  [68, 62, 66, 72],
];
function heatBg(v: number) { return v >= 70 ? C.lightGreen : v >= 50 ? C.lightAmber : C.lightRose; }
function heatFg(v: number) { return v >= 70 ? C.green : v >= 50 ? C.amber : C.rose; }

interface Props { onFinish: () => void; }

export default function Onboarding({ onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [activeQ, setActiveQ] = useState(0);

  const questions0 = [
    '八字、星座、塔罗、黄历……这么多流派，哪个才是准的？',
    '玄学，是几千年样本积累的经验科学，还是人们的心理暗示？',
    '如果给"算命"做一次双盲实验——结果会告诉我们什么？',
  ];

  useEffect(() => {
    if (step !== 0) return;
    setProgress(0);
    setActiveQ(0);
    const totalMs = 6000;
    const start = Date.now();
    let lastQ = 0;
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / totalMs, 1);
      setProgress(p);
      const qIdx = Math.min(Math.floor(elapsed / 2000), questions0.length - 1);
      if (qIdx !== lastQ) { setActiveQ(qIdx); lastQ = qIdx; }
      if (p >= 1) { clearInterval(id); setStep(1); }
    }, 30);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(id);
  }, []);

  const skipBtn: React.CSSProperties = {
    position: 'absolute', top: 20, right: 24,
    fontSize: 13, color: C.ghostInk, background: 'transparent',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', zIndex: 10,
    padding: '6px 12px', borderRadius: 20,
  };
  const primaryBtn: React.CSSProperties = {
    width: '100%', maxWidth: 360, padding: '15px 0',
    borderRadius: 14, background: C.purple, color: '#fff',
    fontSize: 16, fontWeight: 600, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', marginTop: 24,
    boxShadow: '0 4px 20px rgba(107,94,205,0.3)', letterSpacing: '0.3px',
  };

  // ─── Step 0 ───
  const step0 = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', position: 'relative' }}>
      <button style={skipBtn} onClick={onFinish}>跳过 →</button>
      <div style={{ fontSize: 11, letterSpacing: 3, color: C.ghostInk, textTransform: 'uppercase' as const, marginBottom: 36, fontWeight: 500 }}>
        FateLab 2.0 · 个人算法实验室
      </div>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 620, marginBottom: 40, minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {questions0.map((q, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0, width: '100%',
            fontFamily: '"Noto Serif SC","Songti SC","SimSun",serif',
            fontSize: 'clamp(20px,3vw,34px)',
            fontWeight: 400, color: C.ink, lineHeight: 1.6,
            textAlign: 'center', padding: '0 32px',
            opacity: activeQ === i ? 1 : 0,
            transform: activeQ === i ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            pointerEvents: 'none',
          }}>{q}</div>
        ))}
      </div>
      <div style={{
        textAlign: 'center', marginTop: 100,
        opacity: activeQ >= 2 ? 1 : 0,
        transform: activeQ >= 2 ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
      }}>
        <div style={{ fontSize: 15, color: C.paleInk, lineHeight: 1.8, maxWidth: 460, margin: '0 auto' }}>
          我们用<strong style={{ color: C.ink }}>经济学回归分析</strong>，<br />
          收集真实数据，不只是告诉你哪个流派最准——<br />
          更帮你找到<strong style={{ color: C.purple }}>对你个人最准的算命方式</strong>。
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: C.stone }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: C.purple, transition: 'none' }} />
      </div>
    </div>
  );

  // ─── Step 1：实验设计 ───
  const step1 = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 28px 100px', overflowY: 'auto' as const }}>
      <button style={skipBtn} onClick={onFinish}>跳过</button>
      <div style={{ fontSize: 11, letterSpacing: 3, color: C.ghostInk, textTransform: 'uppercase' as const, marginBottom: 16, fontWeight: 500 }}>实验设计</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: C.ink, margin: '0 0 6px', textAlign: 'center' }}>我们是怎么做的</h2>
      <p style={{ fontSize: 14, color: C.paleInk, marginBottom: 32, textAlign: 'center', maxWidth: 480, lineHeight: 1.7 }}>
        不依赖"大师说"，不相信"听起来准"，只相信足量样本下的统计学结论
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, width: '100%', maxWidth: 620 }}>
        {[
          { num: '01', icon: '📡', title: '结构化预测入库', accent: C.purple,
            desc: '收集八字、占星、黄历等各流派的运势预测，统一拆解为「维度·方向·强度」三元素，按标准格式存入，消除模糊表述干扰。' },
          { num: '02', icon: '❓', title: '双盲问卷采集', accent: C.green,
            desc: '系统基于命理内容自动生成中性问题（完全不透露来源），你只根据真实经历作答。这是关键设计——规避期望效应，让数据反映现实而非信念。' },
          { num: '03', icon: '📈', title: '回归分析 · 量化效力', accent: C.amber,
            desc: '计算「预测序列」与「真实反馈序列」的 Pearson 相关系数 r。r 越接近 1 代表越准；同时分析你个人数据，找出对你准确度最高的流派组合。' },
        ].map(c => (
          <div key={c.num} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', background: C.white, borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 16px rgba(60,48,32,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ fontSize: 24 }}>{c.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: c.accent, letterSpacing: 1 }}>{c.num}</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: C.paleInk, lineHeight: 1.75 }}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
      {/* 新增：个人算法亮点 */}
      <div style={{ width: '100%', maxWidth: 620, marginTop: 14, padding: '18px 22px', background: C.lightGold, borderRadius: 14, border: `1px solid rgba(212,165,32,0.2)` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 8 }}>✨ FateLab2 新增：个人算法发现</div>
        <div style={{ fontSize: 13, color: C.softInk, lineHeight: 1.75 }}>
          完成 7/15/30 次盲测后，系统将自动分析你的个人数据，找出<strong>对你准确度最高的流派</strong>，甚至提纯出「八字的姻缘预测 + 星座的健康预测」这样的个人专属算法组合。
        </div>
      </div>
      <button style={primaryBtn} onClick={() => setStep(2)}>下一步，看完成态预览 →</button>
    </div>
  );

  // ─── Step 2：完成态预览（全体 + 个人两个视图） ───
  const [previewTab, setPreviewTab] = useState<'global' | 'personal'>('global');

  const step2 = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 28px 100px', overflowY: 'auto' as const }}>
      <button style={skipBtn} onClick={onFinish}>跳过</button>
      <div style={{ fontSize: 11, letterSpacing: 3, color: C.ghostInk, textTransform: 'uppercase' as const, marginBottom: 16, fontWeight: 500 }}>完成态预览</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 6px', textAlign: 'center' }}>你将看到两种维度的数据</h2>
      <p style={{ fontSize: 13, color: C.paleInk, marginBottom: 20, textAlign: 'center', maxWidth: 460, lineHeight: 1.7 }}>
        <span style={{ fontSize: 12, color: C.ghostInk }}>以下为示例数据，真实看板随实验进展实时更新。</span>
      </p>

      {/* 预览 Tab 切换 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: C.stone, borderRadius: 12, padding: 4 }}>
        {([['global', '📊 全体统计'], ['personal', '🧬 我的算法']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setPreviewTab(key)} style={{
            padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: previewTab === key ? 700 : 400,
            background: previewTab === key ? C.purple : 'transparent',
            color: previewTab === key ? '#fff' : C.paleInk,
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* 全体统计预览 */}
      {previewTab === 'global' && (
        <div style={{ background: C.white, borderRadius: 20, boxShadow: '0 4px 32px rgba(60,48,32,0.08)', padding: 24, width: '100%', maxWidth: 480 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: C.stone, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            {[{ val: '67.3%', label: '整体命中率', color: C.green }, { val: 'n = 128', label: '有效样本', color: C.ink }, { val: 'r = 0.31', label: 'Pearson · p<0.05', color: C.amber }].map(m => (
              <div key={m.label} style={{ background: C.white, padding: '14px 8px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color, marginBottom: 4 }}>{m.val}</div>
                <div style={{ fontSize: 10, color: C.ghostInk }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.ghostInk, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' as const }}>流派命中率排名</div>
            {barData.map((b, i) => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: C.softInk, width: 50, textAlign: 'right' as const, flexShrink: 0 }}>{b.label}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.stone, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: b.color, width: mounted ? `${b.pct}%` : '0%', transition: `width 0.9s ease ${i * 80}ms` }} />
                </div>
                <span style={{ fontSize: 11, color: C.paleInk, width: 30, fontWeight: 600 }}>{b.pct}%</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.ghostInk, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' as const }}>维度热力图</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4, paddingLeft: 38 }}>
              {heatCols.map(c => <span key={c} style={{ flex: 1, fontSize: 10, color: C.ghostInk, textAlign: 'center' as const }}>{c}</span>)}
            </div>
            {heatData.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: C.ghostInk, width: 32, textAlign: 'right' as const, flexShrink: 0 }}>{heatRows[ri]}</span>
                {row.map((v, ci) => (
                  <div key={ci} style={{ flex: 1, height: 24, borderRadius: 6, background: heatBg(v), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: heatFg(v) }}>{v}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 个人算法预览 */}
      {previewTab === 'personal' && (
        <div style={{ background: C.white, borderRadius: 20, boxShadow: '0 4px 32px rgba(60,48,32,0.08)', padding: 24, width: '100%', maxWidth: 480 }}>
          {/* 顶部状态 */}
          <div style={{ background: C.lightGold, borderRadius: 12, padding: '14px 18px', marginBottom: 18, border: `1px solid rgba(212,165,32,0.2)` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 4 }}>🧬 已完成 23 次盲测 · 实验持续 31 天</div>
            <div style={{ fontSize: 12, color: C.softInk }}>已解锁 7天 / 15天 / 30天 全部报告</div>
          </div>

          {/* 最适合你的流派 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.ghostInk, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' as const }}>最适合你的算命方式</div>
            {[
              { label: '八字', pct: 81, color: C.gold, rank: '🥇' },
              { label: '西洋占星', pct: 74, color: C.purple, rank: '🥈' },
              { label: '小六壬', pct: 62, color: C.green, rank: '🥉' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16, width: 24, flexShrink: 0 }}>{b.rank}</span>
                <span style={{ fontSize: 12, color: C.softInk, width: 50, flexShrink: 0 }}>{b.label}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.stone, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: b.color, width: mounted ? `${b.pct}%` : '0%', transition: 'width 0.9s ease' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: b.color, width: 34, flexShrink: 0 }}>{b.pct}%</span>
              </div>
            ))}
          </div>

          {/* 个人专属算法提纯 */}
          <div style={{ background: C.lightPurple, borderRadius: 12, padding: '14px 18px', marginBottom: 18, border: `1px solid rgba(107,94,205,0.15)` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 8 }}>✨ 你的专属算法</div>
            <div style={{ fontSize: 12, color: C.softInk, lineHeight: 1.75 }}>
              · <strong>八字</strong> 对你的 <strong>感情</strong> 预测准确度达 <strong style={{ color: C.purple }}>86%</strong><br />
              · <strong>星座</strong> 对你的 <strong>健康</strong> 预测准确度达 <strong style={{ color: C.purple }}>79%</strong><br />
              · <strong>小六壬</strong> 对你的 <strong>事业</strong> 预测准确度达 <strong style={{ color: C.purple }}>71%</strong>
            </div>
          </div>

          {/* 本周推荐 */}
          <div style={{ background: C.lightGreen, borderRadius: 12, padding: '14px 18px', border: `1px solid rgba(61,153,112,0.15)` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 6 }}>📅 本周推荐参考</div>
            <div style={{ fontSize: 12, color: C.softInk }}>重点参考 <strong>八字</strong>，尤其是感情维度的预测；健康方面可结合 <strong>星座运势</strong>。</div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 480, width: '100%', marginTop: 16, padding: '14px 18px', background: C.lightPurple, borderRadius: 12, border: `1px solid rgba(107,94,205,0.15)` }}>
        <div style={{ fontSize: 12, color: C.purple, fontWeight: 600, marginBottom: 6 }}>你的参与如何推动实验？</div>
        <div style={{ fontSize: 12, color: C.softInk, lineHeight: 1.7 }}>
          每次盲测的答案自动计入全体统计和你的个人分析。
          完成 7 次后解锁个人报告，30 次后你的「专属算法」将具备统计显著性。
        </div>
      </div>

      <button style={primaryBtn} onClick={onFinish}>开始体验 ✨</button>
    </div>
  );

  const dots = step > 0 && (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '0 0 20px' }}>
      {[1, 2].map(i => (
        <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? C.purple : C.stone, transition: 'all 0.3s ease' }} />
      ))}
    </div>
  );

  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {step0}
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}
              style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {step1}{dots}
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}
              style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {step2}{dots}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

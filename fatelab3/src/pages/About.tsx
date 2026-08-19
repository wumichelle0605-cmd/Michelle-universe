import React from 'react';

const C = {
  bg: '#FAF8F4', stone: '#EDE9E1', white: '#FFFFFF',
  purple: '#6B5ECD', lightPurple: '#EEE9FF',
  green: '#3D9970', lightGreen: '#E6F4EE',
  amber: '#C07A28', lightAmber: '#FDF3E3',
  gold: '#D4A520', lightGold: '#FBF3D5',
  rose: '#C05070', lightRose: '#FCEEF2',
  ink: '#1A1714', softInk: '#3D3830', paleInk: '#7A7268', ghostInk: '#B5AFA6',
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.white, borderRadius: 20, padding: 28,
      marginBottom: 20, boxShadow: '0 2px 20px rgba(60,48,32,0.06)',
      ...style
    }}>
      {children}
    </div>
  );
}

export default function About() {
  return (
    <div style={{ padding: '24px 16px', maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: C.ghostInk, textTransform: 'uppercase' as const, marginBottom: 12, fontWeight: 500 }}>
          Creator's Note
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.ink, margin: '0 0 12px' }}>
          FateLab 3.0 · 创作者说
        </h1>
        <div style={{ width: 40, height: 3, background: C.purple, borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 14, color: C.paleInk, fontStyle: 'italic', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          "如果玄学无法被数据证伪，那它或许就是另一种形式的统计学。"
        </div>
      </div>

      {/* 1. 我的出发点 */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' as const }}>我的出发点</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.8, marginBottom: 16 }}>
          一个经济学学生的"唯物主义"困惑
        </p>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, marginBottom: 14 }}>
          作为经济学出身的学生，长期的专业训练塑造了我认识世界的方式：万物皆可量化，
          一切现象背后都隐藏着变量之间的相关系数（r）。我习惯用回归分析拆解世界，
          始终相信只要样本量足够大，噪声终会被过滤，真实的信号一定会浮现。
        </p>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, marginBottom: 14 }}>
          但"算命"始终是我"唯物主义"认知体系里的一个异常值。
        </p>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, marginBottom: 14 }}>
          在我看来，传统命理学的本质，是古人在缺乏计算工具的年代，
          通过口传心授汇集海量样本后沉淀的经验主义概率推论。
          但现实里的矛盾始终无解：对于同一件事，八字断"今日破财"，西洋占星却显示"金星入庙财运亨通"；
          同一段感情，紫微斗数说"姻缘将至"，塔罗牌却抽出"高塔"预示关系破裂——我该信哪个？
        </p>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, marginBottom: 14 }}>
          更根本的问题是：它们预测的，和真实发生的事情，究竟有没有统计学意义上的相关性？
          没有统一的度量衡，没有客观的验证标准，
          用户最终只能陷入"不可知论"，困在"信则灵"的心理暗示里。
        </p>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, margin: 0 }}>
          这个产品的设计初心很简单：<strong style={{ color: C.ink }}>基于统计学的回归分析方法，搞清楚到底哪一种命理算术更准。还是说，这一切只是我们的心理暗示？</strong>
        </p>
      </Card>

      {/* 2. 覆盖所有立场的无偏实验 */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.amber, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' as const }}>覆盖所有立场的无偏实验</div>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, marginBottom: 20 }}>
          本项目从设计之初就不预设"信/不信玄学"的立场，无论你属于哪一类，都能找到参与价值：
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          {[
            {
              icon: '🔮', type: '如果你是玄学爱好者', color: C.purple,
              desc: '不用再纠结"不同方法算出来结果不一样该信谁"，你可以一键用多流派工具测算同一件事，后续也能直接参考全量数据的命中率结论，选择对应领域最可靠的测算方式。'
            },
            {
              icon: '🤔', type: '如果你是中立观望者', color: C.green,
              desc: '可以纯当"玄学观测者"，既可以匿名贡献自己的真实生活数据，也能随时查看公开的回归看板，直观看到各类玄学方法和真实世界的重合度，不用自己踩坑就能拿到客观结论。'
            },
            {
              icon: '📊', type: '如果你和我一样是实证派', color: C.amber,
              desc: '我们会完整公开统计维度、计算逻辑和原始匿名样本，陪你一起验证中西方不同玄学方法的预测结果和真实事件的重合度——最终要么评选出各细分领域最准确的测算方式，要么用足量数据完成对玄学的证伪。'
            },
          ].map(u => (
            <div key={u.type} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 18px', background: C.bg, borderRadius: 14 }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{u.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: u.color, marginBottom: 8 }}>{u.type}</div>
                <div style={{ fontSize: 13, color: C.paleInk, lineHeight: 1.8 }}>{u.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. 证伪，或是重构（只有假设A/B + 结尾段） */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.rose, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' as const }}>证伪，或是重构</div>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, marginBottom: 20 }}>
          作为坚定的唯物主义者，我在最初设计产品时甚至带有强烈的"证伪"目的，我预设了两种完全不同的实验结果：
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, marginBottom: 20 }}>
          <div style={{ background: C.lightRose, borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(192,80,112,0.15)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.rose, marginBottom: 10 }}>假设 A —— 唯物主义结算时刻：证伪</div>
            <div style={{ fontSize: 13, color: C.paleInk, lineHeight: 1.8 }}>
              当我们收集到足够多用户的真实生活数据，和各类流派的预测结果做回归分析后，如果发现所有玄学预测和实际事件的相关系数都趋近于 0，那就可以用科学方法证明玄学只是随机噪声或心理安慰，对厘清认知、破除迷信有明确的价值。
            </div>
          </div>
          <div style={{ background: C.lightGreen, borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(61,153,112,0.15)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 10 }}>假设 B —— 迷人的可能性：发现规律</div>
            <div style={{ fontSize: 13, color: C.paleInk, lineHeight: 1.8 }}>
              如果在大样本下，我们意外发现某些算法在特定维度（比如健康、情绪、特定行业运势）上，和实际数据呈现出统计学显著的正相关（p {'<'} 0.05），那项目的意义就会变成"筛选器"：帮大众从纷繁的流派里找出真正有预测效力的方法，让玄学从"玄之又玄"变成可量化、可参考的概率工具。
            </div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, margin: 0 }}>
          我不希望这个平台成为又一个算命工具。我想把它做成玄学界的双盲实验平台：让数据说话，而不是让大师说话；让回归分析决定哪种方法值得参考，而不是靠口碑或传说——做成玄学界的<strong style={{ color: C.ink }}>"循证医学"</strong>。
        </p>
      </Card>

      {/* 4. 实验设计逻辑 */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.green, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' as const }}>实验设计逻辑</div>
        <p style={{ fontSize: 13, color: C.paleInk, lineHeight: 1.8, marginBottom: 16 }}>
          彻底规避"主观解读""信则灵"的干扰，所有环节标准化、可追溯：
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {[
            { label: '预测端——统一结构化入库', desc: '接入八字、紫微、占星等主流标准化测算工具，用户可以一键完成多流派同主题测算；同时全网爬取主流命理博主公开发布的日/月/年运势内容，按流派、预测时间、预测维度（事业/姻缘/健康/情绪/财运等）做结构化拆分存储，消除模糊表述的干扰。' },
            { label: '事实端——盲测采集真实数据', desc: '接入大模型，基于各流派的预测内容生成完全不关联任何流派的中性确认选择题，比如"今日是否出现以下不适""今日是否有计划外的收入/支出"，用户仅需根据真实情况作答，全程不知道问题对应哪种测算方法，从根源上规避"希望某方法准"的心理暗示偏差。' },
            { label: '校验端——大模型自动打分', desc: '由大模型对「结构化预测内容」和「用户真实回答」做语义匹配，计算二者 diff，差异越小则该条预测的命中率得分越高，全程无人工干预，彻底解决不同人对"准"的判断标准不一致的问题。' },
            { label: '输出端——公开回归看板', desc: '积累足够样本后，所有匿名数据会汇总为公开的全量回归看板，既展示所有流派的整体命中率排名，也会细分到不同维度做区分——比如明确给出"八字在事业流年上命中率72%，在健康问题上命中率41%""塔罗在短期情绪预判上命中率68%"这类具象可参考的结论。' },
          ].map((item, i) => (
            <div key={i} style={{ background: C.bg, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: C.paleInk, lineHeight: 1.75 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. 能力迭代规划 */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' as const }}>能力迭代规划</div>
        <p style={{ fontSize: 14, color: C.paleInk, lineHeight: 1.85, marginBottom: 20 }}>
          从小到大逐步推进，先跑通核心逻辑再拓展边界：
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <div style={{ background: C.lightGreen, borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(61,153,112,0.15)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 10 }}>第一阶段 · 已完成</div>
            <div style={{ fontSize: 13, color: C.paleInk, lineHeight: 1.8 }}>
              接入大模型盲题生成与自动打分能力，同步全量匿名数据至公开看板，所有用户可随时查看各流派实时效力数据。在 3.0 版本中新增个人专属看板与算法 Skill 生成能力，完成最小验证闭环。
            </div>
          </div>
          <div style={{ background: C.lightAmber, borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(192,122,30,0.15)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 10 }}>第二阶段 · 规划中</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {[
                { title: '优化盲测交互体验', desc: '参考弥罗老师提供的思路，引入 Chatbox 对话形式，通过模型追问机制采集更细颗粒度的样本数据，提升置信度。' },
                { title: '拓展测算池与覆盖场景', desc: '接入奇门遁甲等更多中式命理工具，同时引入塔罗等需要抽卡交互的占卜形式，丰富用户的测试体验与流派覆盖范围。' },
                { title: '实现个人 Skill 一键生成', desc: '在现有个人算法组合的基础上，优化生成路径，降低用户使用门槛。当全平台数据积累至足够可信的规模后，蒸馏出一个集合各流派算理优势的通用命理 Skill。' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: C.paleInk, lineHeight: 1.75 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: C.paleInk, lineHeight: 1.8, marginTop: 16 }}>
          最终目标是形成覆盖主流玄学方法的完整验证体系，让每个用户都能找到最适合自己的那套算法。
        </p>
      </Card>

      {/* 6. 你的参与 */}
      <Card style={{ background: C.lightPurple, border: '1px solid rgba(107,94,205,0.15)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' as const }}>你的参与</div>
        <p style={{ fontSize: 14, color: C.softInk, lineHeight: 1.85, marginBottom: 12 }}>
          这个实验需要真实数据。每一次认真作答的盲测问卷，
          都是一个真实数据点——既推动全体实验进展，
          也在积累你个人的算法档案。做得越多，你的专属 Skill 精度越高。
        </p>
        <p style={{ fontSize: 14, color: C.softInk, lineHeight: 1.85, margin: 0 }}>
          不需要你懂统计学，也不需要你懂经济学。
          你只需要如实回答那些关于你真实生活的问题。
          <strong style={{ color: C.purple }}>数据会说话。</strong>
        </p>
      </Card>

      {/* 7. 参考数据源 */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ghostInk, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' as const }}>参考数据源</div>
        <p style={{ fontSize: 13, color: C.paleInk, lineHeight: 1.8, marginBottom: 16 }}>
          用于结构化存储和验证的真实公开数据来源：
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
          {[
            '微博命理博主 RSS', '知乎占星话题 RSS', 'Alapi 黄历 API',
            '聚合数据万年历', '豆瓣紫微斗数小组', '测测 App',
            '奇门遁甲论坛', 'RSSHub 塔罗博主',
          ].map(src => (
            <div key={src} style={{
              padding: '6px 14px', background: C.bg, borderRadius: 20,
              fontSize: 12, color: C.softInk, border: `1px solid ${C.stone}`,
            }}>
              {src}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 20 }}>
        <div style={{ fontSize: 12, color: C.ghostInk }}>FateLab 3.0 · 个人算法实验室 · 开源 · 实证 · 理性 · 让数据说话</div>
      </div>
    </div>
  );
}

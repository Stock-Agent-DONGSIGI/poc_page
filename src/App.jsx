import TradingViewChart from './TradingViewChart.jsx'

const products = [
  {
    emoji: '📊',
    title: '주식 분석',
    desc: '가격 · 재무 · 기술적 지표를 종합한 종목 리포트를 만들어요.',
  },
  {
    emoji: '📰',
    title: '동향 분석',
    desc: '뉴스 · 공시 · 매크로(금리/환율)를 에이전트가 수집하고 요약해요.',
  },
  {
    emoji: '🤖',
    title: 'AI 에이전트',
    desc: '자연어로 묻고 답하는 리서치 · 스크리닝 어시스턴트예요.',
  },
  {
    emoji: '📐',
    title: '퀀트',
    desc: '시그널 생성, 전략 백테스트, 포트폴리오 분석까지 해요.',
  },
]

const values = [
  {
    emoji: '🔍',
    title: '조회 · 분석 전용',
    desc: '자동 매매가 아닌, 의사결정을 돕는 정보 제공에 집중해요.',
  },
  {
    emoji: '🧾',
    title: '투명한 근거',
    desc: '에이전트의 결론에는 출처와 계산 과정을 함께 남겨요.',
  },
  {
    emoji: '🏠',
    title: '개인 친화적',
    desc: '무거운 인프라 없이 개인이 직접 띄워 쓸 수 있는 구조를 지향해요.',
  },
]

const roadmap = [
  {
    emoji: '🧺',
    title: '데이터 수집',
    items: [
      { text: 'API 테스트' },
      { text: 'Reddit · Google News', sub: true },
      { text: 'SEC EDGAR (참고용 연계)', sub: true },
      { text: 'Yahoo Finance — 매크로 정보', sub: true },
      { text: 'Google Map Street View', sub: true },
      { text: 'Crawling' },
      { text: 'Nasdaq Screener', sub: true },
      { text: '기업 대표 사이트', sub: true },
    ],
  },
  {
    emoji: '🧁',
    title: '데이터 가공 · 저장',
    items: [
      { text: '임베딩 작업' },
      { text: 'Clustering — DBSCAN (t-SNE · UMAP)' },
      { text: 'DB 적재' },
      { text: 'Nasdaq Screener 기업별 태그 전수 정리' },
      { text: 'EDGAR 최신 공시를 프론트에서 바로 파악' },
      { text: '차트 변동 — 상승률 상위 · 거래량 기준' },
      { text: '산업군 정리' },
    ],
  },
  {
    emoji: '🧠',
    title: '알고리즘',
    items: [
      { text: '에이전트 Workflow 설계 · 가중치 적용' },
      { text: 'LLM 적용 방안' },
      { text: '분석 Comment 정리 방안', sub: true },
      { text: 'Open Source: Qwen (뉴스 번역)', sub: true },
      { text: 'Proprietary: ChatGPT API', sub: true },
      { text: '파생변수 설계' },
      { text: '차트 분석 지표 — 금융공학 · 시계열(통계학적 분석 위주)' },
    ],
  },
]

const priorities = [
  { rank: 1, method: 'Daily Market Trend Analysis (Top-down)', stars: 5 },
  { rank: 2, method: 'Reddit Community Analysis', stars: 4 },
  { rank: 3, method: 'Macro / Policy Analysis', stars: 4 },
  { rank: 4, method: 'Influencer & Social Media Monitoring', stars: 3 },
]

const milestones = [
  {
    when: '~ 8월 16일',
    title: 'Main Part 완성',
    desc: '데이터 수집 · 가공 및 저장 · 알고리즘, 세 가지 Dev. Mainstream을 완성해요.',
  },
  {
    when: '8월 중순 ~',
    title: 'PoC 단계',
    desc: 'Architecture · 백엔드 · 프론트엔드(대시보드, API 연결) 설계에 들어가요.',
  },
  {
    when: '~ 9월',
    title: '마무리 🎀',
    desc: 'PoC를 다듬어 9월 전까지 완성하는 것을 목표로 해요.',
  },
]

function Stars({ n }) {
  return <span className="stars">{'★'.repeat(n) + '☆'.repeat(5 - n)}</span>
}

export default function App() {
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <a href="#top" className="nav-logo">
            📈 Stock Agent
          </a>
          <div className="nav-links">
            <a href="#markets">마켓</a>
            <a href="#about">소개</a>
            <a href="#values">핵심 가치</a>
            <a href="#roadmap">로드맵</a>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-bubbles" aria-hidden="true">
          <span style={{ width: 90, height: 90, top: '18%', left: '8%' }} />
          <span style={{ width: 50, height: 50, top: '65%', left: '15%', animationDelay: '1.2s' }} />
          <span style={{ width: 120, height: 120, top: '25%', right: '7%', animationDelay: '0.6s' }} />
          <span style={{ width: 40, height: 40, top: '70%', right: '18%', animationDelay: '1.8s' }} />
        </div>
        <div className="hero-badge">🍑 오픈 조직 · Stock-Agent-DONGSIGI</div>
        <h1>Stock Agent</h1>
        <p>
          LLM 에이전트가 시장 데이터를 스스로 수집 · 해석하고, 사람이 이해할 수 있는
          인사이트로 바꿔주는 도구를 만들어요. <strong>Penny Stock</strong> 시장에
          주목해서, 데이터 파이프라인부터 차트 UI, 퀀트 백테스트, 뉴스 · 공시 요약
          에이전트까지 — 개인 투자자가 쓸 수 있는 형태로 묶는 것이 목표예요.
        </p>
        <a className="hero-cta" href="#about">
          우리가 만드는 것 구경하기 ⛅
        </a>
      </header>

      <main>
        <section id="markets" className="alt-bg">
          <div className="container">
            <h2 className="section-title">오늘의 마켓 🍭</h2>
            <p className="section-sub">NASDAQ 100 · S&amp;P 500 지수 캔들 차트</p>
            <div className="chart-grid">
              <div className="chart-card">
                <h3>🌙 NASDAQ 100</h3>
                <div className="chart-body">
                  <TradingViewChart symbol="OANDA:NAS100USD" />
                </div>
              </div>
              <div className="chart-card">
                <h3>🌟 S&amp;P 500</h3>
                <div className="chart-body">
                  <TradingViewChart symbol="OANDA:SPX500USD" />
                </div>
              </div>
            </div>
            <p className="chart-note">차트는 TradingView 위젯으로 제공돼요.</p>
          </div>
        </section>

        <section id="about">
          <div className="container">
            <h2 className="section-title">무엇을 만드나요? 🎨</h2>
            <p className="section-sub">AI 에이전트 기반 주식 분석 · 동향 분석 · 퀀트 서비스</p>
            <div className="card-grid">
              {products.map((p) => (
                <div className="card" key={p.title}>
                  <span className="emoji">{p.emoji}</span>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="values" className="alt-bg">
          <div className="container">
            <h2 className="section-title">핵심 가치 💗</h2>
            <p className="section-sub">우리가 지키고 싶은 세 가지 약속</p>
            <div className="value-list">
              {values.map((v) => (
                <div className="value" key={v.title}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{v.emoji}</div>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roadmap">
          <div className="container">
            <h2 className="section-title">개발 로드맵 🗺️</h2>
            <p className="section-sub">세 가지 Dev. Mainstream (~8월 16일)</p>
            <div className="roadmap-grid">
              {roadmap.map((col) => (
                <div className="roadmap-col" key={col.title}>
                  <h3>
                    <span>{col.emoji}</span> {col.title}
                  </h3>
                  <ul>
                    {col.items.map((item, i) => (
                      <li key={i} className={item.sub ? 'sub' : ''}>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
              분석 방법 우선순위 🏅
            </h2>
            <p className="section-sub">중요도 기반으로 순서를 정했어요</p>
            <div className="table-wrap">
              <table className="priority-table">
                <thead>
                  <tr>
                    <th>우선순위</th>
                    <th>방법</th>
                    <th>중요도</th>
                  </tr>
                </thead>
                <tbody>
                  {priorities.map((p) => (
                    <tr key={p.rank}>
                      <td>
                        <span className="rank-badge">{p.rank}</span>
                      </td>
                      <td>{p.method}</td>
                      <td>
                        <Stars n={p.stars} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="section-title" style={{ fontSize: '1.5rem', marginTop: 64 }}>
              일정 🗓️
            </h2>
            <p className="section-sub">Main Part 완성 이후 PoC 단계로 나아가요</p>
            <div className="timeline">
              {milestones.map((m) => (
                <div className="milestone" key={m.title}>
                  <span className="when">{m.when}</span>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer>
        <div className="foot-logo">📈 Stock Agent</div>
        <div className="disclaimer">
          ⚠️ 본 조직의 산출물은 투자 정보 제공을 목적으로 하며, 투자 권유나 수익을
          보장하지 않습니다. 모든 투자 판단과 책임은 이용자 본인에게 있습니다.
        </div>
        <div className="links">
          <a
            href="https://github.com/Stock-Agent-DONGSIGI"
            target="_blank"
            rel="noreferrer"
          >
            GitHub 🐙
          </a>
          <a
            href="https://github.com/Stock-Agent-DONGSIGI/poc_page/issues"
            target="_blank"
            rel="noreferrer"
          >
            문의 · Issues 💌
          </a>
        </div>
        <div className="copy">© 2026 Stock Agent — made with 🍬 bubble gum pop</div>
      </footer>
    </>
  )
}

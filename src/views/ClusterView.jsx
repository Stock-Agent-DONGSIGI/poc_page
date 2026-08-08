import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL

const CATEGORIES = [
  { key: 'semiconductor', label: '반도체', emoji: '💾' },
  { key: 'mining', label: '광산', emoji: '⛏️' },
  { key: 'aerospace', label: '우주항공', emoji: '🚀' },
  { key: 'quantum', label: '양자', emoji: '⚛️' },
]

const steps = [
  {
    emoji: '🎯',
    title: '1. 타겟 종목 추출',
    desc: '나스닥 스크리너 1차 필터(원주 · 시총≤$2B · US) 1,224종목에서 반도체 13 · 광산 13 · 우주항공 11 · 양자 2, 총 39종목을 추렸어요.',
  },
  {
    emoji: '📰',
    title: '2. 뉴스 수집 + 영어 요약',
    desc: '종목별 최근 14일 Google News 기사(최대 5건)를 모으고, 로컬 LLM qwen3.5:9b 로 영어 요약을 만들었어요.',
  },
  {
    emoji: '🏛️',
    title: '3. EDGAR 사업 설명 수집',
    desc: 'SEC EDGAR 최신 10-K/S-1 공시에서 "Item 1. Business" 섹션을 추출해 프로필 중심 텍스트를 만들었어요.',
  },
  {
    emoji: '🧬',
    title: '4. 임베딩 → t-SNE · UMAP',
    desc: 'qwen3-embedding:0.6b(1024차원)로 두 가지 버전을 임베딩하고 2차원으로 축소해 비교했어요.',
  },
]

export default function ClusterView() {
  const [news, setNews] = useState(null)
  const [summaries, setSummaries] = useState(null)
  const [cat, setCat] = useState('semiconductor')
  const [ticker, setTicker] = useState(null)

  useEffect(() => {
    Promise.all(
      CATEGORIES.map((c) =>
        fetch(`${BASE}data/news_${c.key}.json`).then((r) => r.json()),
      ),
    ).then((arr) => {
      const merged = {}
      arr.forEach((d, i) => {
        merged[CATEGORIES[i].key] = d
      })
      setNews(merged)
    })
    fetch(`${BASE}data/summaries_en.json`)
      .then((r) => r.json())
      .then(setSummaries)
  }, [])

  const tickers = news ? Object.keys(news[cat].tickers) : []
  const activeTicker = ticker && tickers.includes(ticker) ? ticker : tickers[0]
  const detail = news && activeTicker ? news[cat].tickers[activeTicker] : null

  return (
    <main>
      <section className="page-head alt-bg">
        <div className="container">
          <h2 className="section-title">클러스터 적용 아이디어 · 결과 🧬</h2>
          <p className="section-sub">
            "종목을 사업 내용으로 묶을 수 있을까?" — 임베딩 기반 군집화 실험이에요
          </p>
        </div>
      </section>

      <section>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            파이프라인 🧁
          </h2>
          <div className="card-grid">
            {steps.map((s) => (
              <div className="card" key={s.title}>
                <span className="emoji">{s.emoji}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="alt-bg">
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            결과 비교 — 뉴스 포함 vs 사업 프로필 🖼️
          </h2>
          <p className="section-sub">
            같은 39종목, 같은 임베딩 모델 — 입력 텍스트만 바꿨을 때의 차이예요
          </p>
          <div className="figure-stack">
            <figure className="figure-card">
              <figcaption>
                🅰️ 회사 프로필 + <b>뉴스 요약</b> 임베딩 — 실루엣 0.042
              </figcaption>
              <img
                src={`${BASE}img/cluster_tsne_umap.png`}
                alt="뉴스 포함 임베딩의 t-SNE / UMAP 산점도"
                loading="lazy"
              />
            </figure>
            <figure className="figure-card">
              <figcaption>
                🅱️ EDGAR <b>사업 설명</b> 임베딩 (뉴스 제외) — 실루엣 <b>0.103</b> ✨
              </figcaption>
              <img
                src={`${BASE}img/profile_tsne_umap.png`}
                alt="EDGAR 사업 프로필 임베딩의 t-SNE / UMAP 산점도"
                loading="lazy"
              />
            </figure>
          </div>

          <div className="insight-grid">
            <div className="insight">
              <h3>📈 군집 품질 2.5배</h3>
              <p>
                뉴스 요약이 섞이면 소송 · 상장폐지 같은 섹터와 무관한 이벤트가 벡터를
                흔들어요. 사업 설명만 쓰니 카테고리 실루엣 점수가 0.042 → 0.103 으로
                올랐어요.
              </p>
            </div>
            <div className="insight">
              <h3>🫧 SPAC 끼리 뭉쳤어요</h3>
              <p>
                SAAQ(우주항공) · QUMS(양자)는 이름만 다른 SPAC(blank check company)이라
                사업 설명이 사실상 같아요. 임베딩 공간에서도 딱 붙어 있어요 — 벡터가
                실제 사업 내용을 반영한다는 증거!
              </p>
            </div>
            <div className="insight">
              <h3>🔍 분류 오류도 잡아냈어요</h3>
              <p>
                스크리너가 Steel/Iron Ore 로 분류한 GDC · INHD 는 실제론 미디어/AI ·
                건설자재 회사예요. 임베딩 지도에서 광산 군집 밖에 떨어져 있어서 분류
                오류가 바로 보였어요.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            종목별 뉴스 · LLM 요약 살펴보기 🔎
          </h2>
          <p className="section-sub">
            수집 시점: 2026-08-08 · 요약 모델: qwen3.5:9b (영어)
          </p>
          {!news || !summaries ? (
            <p className="loading">데이터 불러오는 중... 🍩</p>
          ) : (
            <>
              <div className="chip-row">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    className={`chip ${cat === c.key ? 'on' : ''}`}
                    onClick={() => {
                      setCat(c.key)
                      setTicker(null)
                    }}
                  >
                    {c.emoji} {c.label} ({news[c.key] ? Object.keys(news[c.key].tickers).length : 0})
                  </button>
                ))}
              </div>
              <div className="chip-row small">
                {tickers.map((t) => (
                  <button
                    key={t}
                    className={`chip tiny ${activeTicker === t ? 'on' : ''}`}
                    onClick={() => setTicker(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {detail && (
                <div className="detail-card">
                  <h3>
                    {activeTicker} — {detail.name}
                  </h3>
                  <p className="summary-en">
                    🤖 {summaries.summaries[activeTicker] || '요약 없음'}
                  </p>
                  <ul className="article-list">
                    {detail.articles.length === 0 && <li>최근 14일 기사 없음</li>}
                    {detail.articles.map((a, i) => (
                      <li key={i}>
                        <a href={a.url} target="_blank" rel="noreferrer">
                          {a.title}
                        </a>
                        <span className="article-meta">
                          {a.source} · {(a.published || '').slice(0, 10)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

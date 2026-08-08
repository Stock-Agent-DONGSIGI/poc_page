import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL

const collectors = [
  {
    emoji: '📰',
    title: 'Google News',
    desc: 'RSS 기반 (공식 API 없음). 키워드 · 토픽 · 헤드라인 검색, 한국어/영어 지원. URL 기준 중복 제거 후 JSON 병합 저장.',
    endpoint: 'GET /api/news?keyword=…&lang=en&country=US',
  },
  {
    emoji: '👽',
    title: 'Reddit',
    desc: '공식 RSS(Atom) 피드 기본, OAuth 키가 있으면 자동 전환. 글 ID 기준 중복 제거, 재시작 시 이력 이어받기.',
    endpoint: 'GET /api/reddit?sub=pennystocks',
  },
  {
    emoji: '📊',
    title: 'Nasdaq Screener',
    desc: '당일 전 종목 스냅샷 (7,127개). JSON + CSV 저장, 타겟 필터 · 실시간 조회 · CSV 다운로드 지원.',
    endpoint: 'POST /api/screener/filter {"target": true}',
  },
  {
    emoji: '🏛️',
    title: 'EDGAR (company-verification)',
    desc: 'CIK · SIC 분류 · 본사 주소 조회 + 10-K 공시 원문에서 사업 설명(Item 1) 추출.',
    endpoint: 'GET /api/verify/edgar/lookup?ticker=WWR',
  },
  {
    emoji: '🧠',
    title: 'LLM 분석 (ollama)',
    desc: 'qwen3.5:9b — 기사 요약 · 티커/감성/주제 추출 (thinking 끔). 티커는 스크리너 심볼과 대조 검증.',
    endpoint: 'GET /api/news/analyze?url=…',
  },
  {
    emoji: '🧲',
    title: '임베딩 (ollama)',
    desc: 'qwen3-embedding:0.6b, 1024차원. PostgreSQL + pgvector 에 적재해 자연어 유사 회사 검색.',
    endpoint: 'POST /api/similar {"text": "biotech drug development"}',
  },
]

const REDDIT_SUBS = [
  { key: 'reddit_pennystocks', label: 'r/pennystocks' },
  { key: 'reddit_wallstreetbets', label: 'r/wallstreetbets' },
]

export default function ApiTestView() {
  const [gnews, setGnews] = useState(null)
  const [sub, setSub] = useState('reddit_pennystocks')
  const [reddit, setReddit] = useState({})

  useEffect(() => {
    fetch(`${BASE}data/gnews_penny_stock.json`)
      .then((r) => r.json())
      .then(setGnews)
  }, [])

  useEffect(() => {
    if (reddit[sub]) return
    fetch(`${BASE}data/${sub}.json`)
      .then((r) => r.json())
      .then((d) => setReddit((prev) => ({ ...prev, [sub]: d })))
  }, [sub, reddit])

  const redditPosts = reddit[sub]?.items ?? reddit[sub]?.posts ?? []

  return (
    <main>
      <section className="page-head alt-bg">
        <div className="container">
          <h2 className="section-title">API 테스트 🔌</h2>
          <p className="section-sub">
            로컬 서버(FastAPI + ollama + PostgreSQL)에서 돌아가는 수집기들이에요.
            GitHub Pages 는 정적 호스팅이라, 여기서는 <b>실제 수집된 데이터 스냅샷</b>을
            보여드려요 🍪
          </p>
        </div>
      </section>

      <section>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            수집기 구성 🧺
          </h2>
          <p className="section-sub">
            BaseCollector 규약 하나로 통일 — fetch() → 중복 제거 → JSON 저장
          </p>
          <div className="card-grid">
            {collectors.map((c) => (
              <div className="card" key={c.title}>
                <span className="emoji">{c.emoji}</span>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                <code className="endpoint">{c.endpoint}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="alt-bg">
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            Google News 수집 샘플 📰
          </h2>
          <p className="section-sub">
            검색어 "penny stock" (en/US) — 실제 저장된 JSON 그대로예요
          </p>
          {!gnews ? (
            <p className="loading">불러오는 중... 🍩</p>
          ) : (
            <div className="detail-card">
              <h3>
                🔎 "{gnews.query}" · {gnews.count}건 수집 (업데이트{' '}
                {(gnews.updated_at || '').slice(0, 10)})
              </h3>
              <ul className="article-list">
                {(gnews.articles || gnews.items || []).slice(0, 10).map((a, i) => (
                  <li key={i}>
                    <a href={a.url} target="_blank" rel="noreferrer">
                      {a.title}
                    </a>
                    <span className="article-meta">
                      {a.source} · {(a.published || '').slice(0, 16)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            Reddit 수집 샘플 👽
          </h2>
          <p className="section-sub">서브레딧 새 글 폴링 — 글 ID 기준 누적 저장</p>
          <div className="chip-row">
            {REDDIT_SUBS.map((s) => (
              <button
                key={s.key}
                className={`chip ${sub === s.key ? 'on' : ''}`}
                onClick={() => setSub(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          {!reddit[sub] ? (
            <p className="loading">불러오는 중... 🍩</p>
          ) : (
            <div className="detail-card">
              <ul className="article-list">
                {redditPosts.slice(0, 10).map((p, i) => (
                  <li key={i}>
                    <a href={p.url} target="_blank" rel="noreferrer">
                      {p.title}
                    </a>
                    <span className="article-meta">
                      u/{p.author} · {(p.created_utc || '').slice(0, 16)}
                      {p.score != null && ` · ▲${p.score}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="alt-bg">
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            실제 서버는요? 🏠
          </h2>
          <div className="note-card">
            <p>
              전체 테스트 콘솔(수집 실행 · LLM 분석 · 임베딩 검색 · DB 적재)은 로컬
              서버에서 돌아가요. GPU(ollama)와 PostgreSQL 이 필요해서 GitHub Pages 에는
              올릴 수 없고, 팀 내부에서는 tailscale 로 접속해요.
            </p>
            <code className="endpoint block">
              uv run uvicorn server.main:app --host 0.0.0.0 --port 8010
            </code>
          </div>
        </div>
      </section>
    </main>
  )
}

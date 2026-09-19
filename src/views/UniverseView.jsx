import { useEffect, useMemo, useState } from 'react'
import { UNIVERSE_PROMPT } from '../data/universePrompt.js'

const BASE = import.meta.env.BASE_URL
const SRC_FILE = 'nasdaq_screener_1789801960555.csv'
const OUT_FILE = 'universe_filtered.csv'

/* ── 아주 작은 CSV 파서 (따옴표 · 따옴표 안 콤마 처리) ─────────────── */
function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  const [head, ...body] = rows
  return body
    .filter((r) => r.length === head.length && r[0])
    .map((r) => {
      const o = {}
      head.forEach((h, i) => (o[h] = r[i]))
      return {
        symbol: o.Symbol,
        name: o.Name,
        last_sale: num(o['Last Sale']),
        pct_change: num(o['% Change']),
        market_cap: num(o['Market Cap']),
        country: o.Country,
        ipo_year: o['IPO Year'] ? String(parseInt(o['IPO Year'], 10)) : '',
        volume: num(o.Volume),
        sector: o.Sector,
        industry: o.Industry,
      }
    })
}

function num(v) {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(/[$,%]/g, ''))
  return Number.isFinite(n) ? n : null
}

/* 제외된 종목을 프롬프트의 Hard Exclusion 항목별로 대략 분류 (표시용 휴리스틱) */
const NON_COMMON = /warrant|\brights?\b|\bunits?\b|preferred|depositary|\bnotes\b|\bETF\b|\bETN\b|\bfund\b/i
function bucket(r) {
  if (r.sector === 'Health Care') return 'A. 바이오 · 헬스케어'
  if (/blank check/i.test(r.industry || '')) return 'C · D. SPAC / Blank Check'
  if (NON_COMMON.test(r.name || '')) return 'C. Warrant · Rights · Unit · Preferred 등'
  return 'B · E · F · G. 소재지 · 상장상태 · Shell 등 (LLM 판단)'
}

const BUCKET_ORDER = [
  'A. 바이오 · 헬스케어',
  'C · D. SPAC / Blank Check',
  'C. Warrant · Rights · Unit · Preferred 등',
  'B · E · F · G. 소재지 · 상장상태 · Shell 등 (LLM 판단)',
]

const rules = [
  {
    emoji: '🧬',
    title: 'A. 산업 · 섹터 제외',
    desc: '핵심 사업이 바이오 · 제약 · 의료 · 헬스케어인 기업은 세부 분류명이 달라도 제외. 일부 제품만 의료 관련이면 유지.',
    tags: ['Biotech', 'Pharma', 'Medical Devices', 'Diagnostics', 'Life Sciences', 'Genomics'],
  },
  {
    emoji: '🌏',
    title: 'B. 국가 · 소재지 제외',
    desc: '본사 · 법적 소재지 · 지배구조 기준으로 중국 · 이스라엘 기반 기업(ADR 포함) 제외. 단순히 그 나라에서 사업만 하는 경우는 유지.',
    tags: ['China ADR', 'Israel ADR', 'HQ', 'Domicile', 'Controlling ownership'],
  },
  {
    emoji: '📜',
    title: 'C. Common Stock 이 아닌 증권 제외',
    desc: '개별 기업의 보통주만 남기고 펀드 · 파생 · 구조화 증권은 모두 제외.',
    tags: ['ETF', 'ETN', 'Warrant', 'Rights', 'Unit', 'Preferred', 'Convertible'],
  },
  {
    emoji: '🫙',
    title: 'D. SPAC · Shell Company 제외',
    desc: '사업체가 형성되지 않았거나 인수 · 합병용 자금 보유가 주된 활동인 기업 제외.',
    tags: ['SPAC', 'Blank Check', 'Shell'],
  },
  {
    emoji: '🚪',
    title: 'E. 상장 상태 관련 제외',
    desc: 'Delisted · 상장폐지 확정 · OTC 이전 결정 · 장기 Trading Halt 종목 제외. Compliance Deficiency 통보만으로는 유지.',
    tags: ['Delisted', 'OTC 이전', 'Trading Halt'],
  },
  {
    emoji: '🧊',
    title: 'F · G. 거래 불가 · 실질 사업 없음',
    desc: '정상적인 진입 · 청산이 불가능할 만큼 유동성이 없거나, 청산 · 파산으로 사업이 중단된 기업 제외. 단순 저거래량은 유지.',
    tags: ['장기 거래정지', '청산', '파산', '사업 종료'],
  },
]

const keeps = [
  {
    emoji: '🔁',
    title: 'Corporate Action',
    tags: ['Reverse Split', 'Forward Split', 'Frequent M&A'],
  },
  {
    emoji: '💧',
    title: 'Dilution',
    tags: ['ATM Offering', 'Shelf Registration', 'Convertible Notes', 'Warrants', '최근 자금조달'],
  },
  {
    emoji: '⚠️',
    title: 'Nasdaq Deficiency',
    tags: ['Min Bid Price', 'Market Value', "Shareholders' Equity", 'Cure Period'],
  },
  {
    emoji: '📈',
    title: 'Trading Characteristics',
    tags: ['Low Float', 'High Short Interest', 'High Volatility', 'Recent Spike / Decline', 'Unusual Volume'],
  },
]

const fmtCap = (v) =>
  v == null ? '' : v >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : (v / 1e6).toFixed(1) + 'M'
const fmtNum = (v) => (v == null ? '' : v.toLocaleString())
const fmtInt = (v) => v.toLocaleString()

export default function UniverseView() {
  const [src, setSrc] = useState(null)
  const [uni, setUni] = useState(null)
  const [sector, setSector] = useState('all')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('market_cap')
  const [asc, setAsc] = useState(false)
  const [top, setTop] = useState(100)

  useEffect(() => {
    fetch(`${BASE}data/${SRC_FILE}`).then((r) => r.text()).then((t) => setSrc(parseCsv(t)))
    fetch(`${BASE}data/${OUT_FILE}`).then((r) => r.text()).then((t) => setUni(parseCsv(t)))
  }, [])

  const stats = useMemo(() => {
    if (!src || !uni) return null
    const keep = new Set(uni.map((r) => r.symbol))
    const removed = src.filter((r) => !keep.has(r.symbol))
    const buckets = {}
    removed.forEach((r) => {
      const b = bucket(r)
      buckets[b] = (buckets[b] || 0) + 1
    })
    const sectors = {}
    uni.forEach((r) => {
      const k = r.sector || '(미분류)'
      sectors[k] = (sectors[k] || 0) + 1
    })
    const caps = uni.map((r) => r.market_cap).filter((v) => v != null)
    const prices = uni.map((r) => r.last_sale).filter((v) => v != null)
    const under5 = prices.filter((p) => p < 5).length
    const under50m = caps.filter((c) => c < 50e6).length
    return {
      srcCount: src.length,
      uniCount: uni.length,
      removedCount: removed.length,
      buckets: BUCKET_ORDER.map((k) => [k, buckets[k] || 0]).sort((a, b) => b[1] - a[1]),
      sectors: Object.entries(sectors).sort((a, b) => b[1] - a[1]),
      maxCap: Math.max(...caps),
      under5,
      under50m,
    }
  }, [src, uni])

  const sectorList = stats ? stats.sectors.map(([k]) => k) : []

  const rows = useMemo(() => {
    if (!uni) return []
    let out = uni
    if (sector !== 'all') out = out.filter((r) => (r.sector || '(미분류)') === sector)
    const q = query.trim().toLowerCase()
    if (q)
      out = out.filter(
        (r) =>
          r.symbol.toLowerCase().includes(q) ||
          (r.name || '').toLowerCase().includes(q) ||
          (r.industry || '').toLowerCase().includes(q),
      )
    return [...out].sort((a, b) => {
      const av = a[sortBy]
      const bv = b[sortBy]
      if (av == null) return 1
      if (bv == null) return -1
      return asc ? av - bv : bv - av
    })
  }, [uni, sector, query, sortBy, asc])

  const shown = rows.slice(0, +top || 100)

  return (
    <main>
      <section className="page-head alt-bg">
        <div className="container">
          <h2 className="section-title">Universe 1차 필터링 🧹</h2>
          <p className="section-sub">
            Nasdaq Screener 에서 <b>Micro · Nano 규모의 미국 기업</b>만 추린 뒤, LLM 에게
            Hard Exclusion 프롬프트를 주어 <b>우리가 운용할 후보 Universe</b> 를 선별했어요.
            투자 매력도 판단은 하지 않고, 명확히 걸러야 할 종목만 제거하는 단계예요.
          </p>
        </div>
      </section>

      {/* ── Funnel ─────────────────────────────────────────────── */}
      <section>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            선별 흐름 🪣
          </h2>
          <p className="section-sub">숫자는 public/data 의 두 CSV 를 브라우저에서 직접 읽어 계산해요</p>
          <div className="funnel">
            <div className="funnel-step">
              <div className="step-label">① Nasdaq Screener 전체</div>
              <div className="step-num">7,127</div>
              <div className="step-desc">나스닥 전 종목 스냅샷</div>
              <span className="step-file">screener_latest.json</span>
              <span className="arrow" aria-hidden="true">
                ▶
              </span>
            </div>
            <div className="funnel-step">
              <div className="step-label">② Micro · Nano Cap · US 기업</div>
              <div className="step-num">{stats ? fmtInt(stats.srcCount) : '…'}</div>
              <div className="step-desc">스크리너 필터 (시총 · 국가) 로 1차 다운로드</div>
              <span className="step-file">{SRC_FILE}</span>
              <span className="arrow" aria-hidden="true">
                ▶
              </span>
            </div>
            <div className="funnel-step">
              <div className="step-label">③ LLM Hard Exclusion</div>
              <div className="step-num">
                −{stats ? fmtInt(stats.removedCount) : '…'}
              </div>
              <div className="step-desc">
                바이오 · 헬스케어, SPAC, Warrant · Unit · Preferred, 중국 · 이스라엘, Shell,
                상장폐지 등 제거
                {stats && ` (${Math.round((stats.removedCount / stats.srcCount) * 100)}%)`}
              </div>
              <span className="step-file">프롬프트는 아래 참고 👇</span>
              <span className="arrow" aria-hidden="true">
                ▶
              </span>
            </div>
            <div className="funnel-step final">
              <div className="step-label">④ 후보 Universe ✨</div>
              <div className="step-num">{stats ? fmtInt(stats.uniCount) : '…'}</div>
              <div className="step-desc">
                이후 뉴스 · SEC · Reddit · Short Interest 분석 에이전트의 입력이 돼요
              </div>
              <a className="step-file" href={`${BASE}data/${OUT_FILE}`} download>
                {OUT_FILE} ⬇️
              </a>
            </div>
          </div>

          {stats && (
            <div className="card-grid" style={{ marginBottom: 40 }}>
              <div className="detail-card">
                <h3>🗑️ 제거된 {fmtInt(stats.removedCount)}종목은 왜?</h3>
                <ul className="bar-list">
                  {stats.buckets.map(([k, v]) => (
                    <li key={k}>
                      <span>{k}</span>
                      <span
                        className="bar dim"
                        style={{ width: `${(v / stats.buckets[0][1]) * 100}%` }}
                      />
                      <span className="cnt">{fmtInt(v)}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: '0.8rem', marginTop: 12, color: 'var(--accent)' }}>
                  * 스크리너의 섹터 · 산업 · 이름 컬럼 기준으로 나눈 표시용 분류예요. 실제 판단은
                  LLM 이 프롬프트 기준으로 종목별로 수행했어요.
                </p>
              </div>
              <div className="detail-card">
                <h3>🧺 남은 {fmtInt(stats.uniCount)}종목 섹터 분포</h3>
                <ul className="bar-list">
                  {stats.sectors.map(([k, v]) => (
                    <li key={k}>
                      <span>{k}</span>
                      <span
                        className="bar"
                        style={{ width: `${(v / stats.sectors[0][1]) * 100}%` }}
                      />
                      <span className="cnt">{fmtInt(v)}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: '0.8rem', marginTop: 12, color: 'var(--accent)' }}>
                  시총 최대 {fmtCap(stats.maxCap)} · $5 미만 {fmtInt(stats.under5)}종목 · 시총 $50M
                  미만 {fmtInt(stats.under50m)}종목
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Prompt rules ───────────────────────────────────────── */}
      <section className="alt-bg">
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            Hard Exclusion 규칙 🚫
          </h2>
          <p className="section-sub">
            LLM 에게 "1차 종목 필터링 엔진" 역할을 주고, 아래 조건에 <b>명확히</b> 해당할 때만
            제외하도록 했어요
          </p>
          <div className="rule-grid">
            {rules.map((r) => (
              <div className="rule" key={r.title}>
                <h3>
                  {r.emoji} {r.title}
                </h3>
                <p>{r.desc}</p>
                <div className="tag-row">
                  {r.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <h2 className="section-title" style={{ fontSize: '1.5rem', marginTop: 56 }}>
            절대 자동 제외하지 않는 것 🛡️
          </h2>
          <p className="section-sub">
            Penny Stock 특유의 위험 요소는 <b>Risk Factor 로 다음 단계에 넘기고</b> Universe 에는
            남겨요
          </p>
          <div className="rule-grid">
            {keeps.map((r) => (
              <div className="rule keep" key={r.title}>
                <h3>
                  {r.emoji} {r.title}
                </h3>
                <div className="tag-row">
                  {r.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="card-grid" style={{ marginTop: 28 }}>
            <div className="value">
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🔎</div>
              <h3>원칙 1 · 명확한 경우에만</h3>
              <p>객관적 근거가 있을 때만 제외하고, 정보가 부족하면 남겨둬요.</p>
            </div>
            <div className="value">
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🗺️</div>
              <h3>원칙 2 · 국가 ≠ 사업 지역</h3>
              <p>본사 · 법적 소재지 · 지배구조로 판단하고, 판매 지역만으로는 제외하지 않아요.</p>
            </div>
            <div className="value">
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>⚖️</div>
              <h3>원칙 3 · Risk ≠ Exclusion</h3>
              <p>위험하다고 빼지 않아요. Reverse Split · Dilution · Deficiency 는 유지해요.</p>
            </div>
          </div>

          <details className="prompt-box">
            <summary>📝 LLM 에 입력한 프롬프트 전문 보기</summary>
            <pre>{UNIVERSE_PROMPT}</pre>
          </details>
        </div>
      </section>

      {/* ── Result table ───────────────────────────────────────── */}
      <section>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            후보 Universe 둘러보기 🔭
          </h2>
          <p className="section-sub">{OUT_FILE} 전체를 섹터 · 검색어로 탐색할 수 있어요</p>

          <div className="chip-row small">
            <button
              className={`chip tiny ${sector === 'all' ? 'on' : ''}`}
              onClick={() => setSector('all')}
            >
              전체 {stats ? fmtInt(stats.uniCount) : ''}
            </button>
            {sectorList.map((s) => (
              <button
                key={s}
                className={`chip tiny ${sector === s ? 'on' : ''}`}
                onClick={() => setSector(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="filter-panel">
            <label className="inp" style={{ flex: 1 }}>
              검색 (심볼 · 이름 · 산업)
              <input
                className="search-inp"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: software, bank, AAME"
              />
            </label>
            <label className="inp">
              정렬
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="market_cap">시총</option>
                <option value="last_sale">가격</option>
                <option value="pct_change">수익률</option>
                <option value="volume">거래량</option>
              </select>
            </label>
            <label className="chk">
              <input type="checkbox" checked={asc} onChange={(e) => setAsc(e.target.checked)} />
              오름차순
            </label>
            <label className="inp">
              상위 N
              <input value={top} onChange={(e) => setTop(e.target.value)} />
            </label>
          </div>

          <p className="result-count">
            {!uni
              ? 'CSV 불러오는 중... 🍩'
              : `${fmtInt(rows.length)}종목 일치 · ${fmtInt(shown.length)}개 표시`}
          </p>

          <div className="table-wrap">
            <table className="priority-table screener-table">
              <thead>
                <tr>
                  <th>심볼</th>
                  <th>이름</th>
                  <th className="num">가격($)</th>
                  <th className="num">수익률(%)</th>
                  <th className="num">거래량</th>
                  <th className="num">시총</th>
                  <th>IPO</th>
                  <th>섹터</th>
                  <th>산업</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.symbol}>
                    <td>
                      <a
                        href={`https://www.nasdaq.com/market-activity/stocks/${r.symbol.toLowerCase()}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.symbol}
                      </a>
                    </td>
                    <td className="name-cell">{r.name}</td>
                    <td className="num">{r.last_sale}</td>
                    <td className={`num ${(r.pct_change ?? 0) >= 0 ? 'pos' : 'neg'}`}>
                      {r.pct_change}
                    </td>
                    <td className="num">{fmtNum(r.volume)}</td>
                    <td className="num">{fmtCap(r.market_cap)}</td>
                    <td>{r.ipo_year}</td>
                    <td>{r.sector}</td>
                    <td className="name-cell">{r.industry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="note-card" style={{ marginTop: 28 }}>
            <p>
              💛 이 단계의 목적은 <b>추천이 아니라 선별</b>이에요. 여기서 남은 종목들이
              다음 단계인 뉴스 · SEC Filing · Reddit · Short Interest · Corporate Action 분석
              에이전트의 입력 Universe 가 돼요.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

import { useEffect, useMemo, useState } from 'react'

const BASE = import.meta.env.BASE_URL

/* api_test/collectors/nasdaq_screener.py 의 ScreenerFilter 를 JS 로 포팅한 것.
   원주(보통주) 판별: 이름/심볼 접미사 휴리스틱 (ADR · MLP 원주는 유지) */
const NON_COMMON_NAME = /warrant|\brights?\b(?!\s+to\s)|preferred|\bnotes\b/i
const SPAC_UNIT_NAME = /\bunits?\b/i
const SPAC_UNIT_HINT = /consist|warrant|right|acquisition/i
const NON_COMMON_SYMBOL = /^[A-Z]{4}[WRU]$/

function isCommonStock(r) {
  const name = r.name || ''
  const symbol = r.symbol || ''
  if (symbol.includes('^') || NON_COMMON_SYMBOL.test(symbol)) return false
  if (NON_COMMON_NAME.test(name)) return false
  if (SPAC_UNIT_NAME.test(name) && SPAC_UNIT_HINT.test(name)) return false
  return true
}

function applyFilters(rows, f) {
  let out = rows
  if (f.target) {
    out = out.filter(
      (r) =>
        isCommonStock(r) &&
        (r.market_cap == null || r.market_cap <= 2_000_000_000) &&
        (r.country || '').includes('United States'),
    )
  }
  if (f.excludeHC) out = out.filter((r) => r.sector !== 'Health Care')
  if (f.commonOnly && !f.target) out = out.filter(isCommonStock)
  if (f.penny)
    out = out.filter(
      (r) =>
        r.last_sale != null &&
        r.last_sale < 5 &&
        (r.market_cap == null || r.market_cap <= 300_000_000),
    )
  if (f.maxCap)
    out = out.filter((r) => r.market_cap != null && r.market_cap <= f.maxCap)
  if (f.pctLo !== '')
    out = out.filter((r) => r.pct_change != null && r.pct_change >= +f.pctLo)
  if (f.volLo !== '')
    out = out.filter((r) => r.volume != null && r.volume >= +f.volLo)

  const key = f.sortBy
  out = [...out].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null) return 1
    if (bv == null) return -1
    return f.asc ? av - bv : bv - av
  })
  return out
}

const fmtCap = (v) =>
  v == null ? '' : v >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : (v / 1e6).toFixed(1) + 'M'
const fmtNum = (v) => (v == null ? '' : v.toLocaleString())

const DEFAULT = {
  target: true,
  excludeHC: true,
  commonOnly: false,
  penny: false,
  maxCap: '',
  pctLo: '',
  volLo: '',
  sortBy: 'pct_change',
  asc: false,
  top: 50,
  showAll: false,
}

export default function ScreenerView() {
  const [data, setData] = useState(null)
  const [f, setF] = useState(DEFAULT)

  useEffect(() => {
    fetch(`${BASE}data/screener_latest.json`)
      .then((r) => r.json())
      .then(setData)
  }, [])

  const rows = data?.items ?? []
  const filtered = useMemo(
    () => (f.showAll ? rows : applyFilters(rows, f)),
    [rows, f],
  )
  const shown = f.showAll ? filtered : filtered.slice(0, f.top || 50)
  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  return (
    <main>
      <section className="page-head alt-bg">
        <div className="container">
          <h2 className="section-title">Screener 필터 적용 🎯</h2>
          <p className="section-sub">
            나스닥 스냅샷 {data ? data.count.toLocaleString() : '…'}종목 (
            {data?.as_of || '…'} 기준)에 팀 타겟 필터를 <b>브라우저에서 직접</b>{' '}
            적용해요 — 서버 없이 동작해요 💛
          </p>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="filter-panel">
            <label className="chk">
              <input type="checkbox" checked={f.target} onChange={set('target')} />
              타겟 필터 (원주 · 시총≤$2B · US만)
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.excludeHC} onChange={set('excludeHC')} />
              Health Care 제외
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.commonOnly} onChange={set('commonOnly')} />
              원주만
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.penny} onChange={set('penny')} />
              penny (&lt;$5 · 시총&lt;$300M)
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.showAll} onChange={set('showAll')} />
              전체 목록 (필터 무시)
            </label>
            <label className="inp">
              시총 ≤ ($)
              <input value={f.maxCap} onChange={set('maxCap')} placeholder="예: 500000000" />
            </label>
            <label className="inp">
              수익률 ≥ (%)
              <input value={f.pctLo} onChange={set('pctLo')} placeholder="예: 5" />
            </label>
            <label className="inp">
              거래량 ≥
              <input value={f.volLo} onChange={set('volLo')} placeholder="예: 100000" />
            </label>
            <label className="inp">
              정렬
              <select value={f.sortBy} onChange={set('sortBy')}>
                <option value="pct_change">수익률</option>
                <option value="volume">거래량</option>
                <option value="market_cap">시총</option>
                <option value="last_sale">가격</option>
              </select>
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.asc} onChange={set('asc')} />
              오름차순
            </label>
            <label className="inp">
              상위 N
              <input value={f.top} onChange={set('top')} />
            </label>
          </div>

          <p className="result-count">
            {!data
              ? '스냅샷 불러오는 중... 🍩 (약 2MB)'
              : `전체 ${rows.length.toLocaleString()}종목 중 ${filtered.length.toLocaleString()}종목 일치 · ${shown.length.toLocaleString()}개 표시`}
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
                  <th>국가</th>
                  <th>섹터</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.symbol}>
                    <td>
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.symbol}
                      </a>
                    </td>
                    <td className="name-cell">{r.name}</td>
                    <td className="num">{r.last_sale}</td>
                    <td className={`num ${r.pct_change >= 0 ? 'pos' : 'neg'}`}>
                      {r.pct_change}
                    </td>
                    <td className="num">{fmtNum(r.volume)}</td>
                    <td className="num">{fmtCap(r.market_cap)}</td>
                    <td>{r.country}</td>
                    <td>{r.sector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="note-card" style={{ marginTop: 28 }}>
            <p>
              🍡 이 페이지의 필터 로직은 로컬 서버 <code>ScreenerFilter</code>(Python)를
              JS 로 그대로 포팅한 거예요. 원주 판별(워런트 · 라이트 · SPAC 유닛 ·
              우선주 제외), 타겟 프리셋, Health Care 제외까지 동일하게 동작해요.
              데이터는 {data?.as_of || ''} 스냅샷이라 실시간 시세는 아니에요.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

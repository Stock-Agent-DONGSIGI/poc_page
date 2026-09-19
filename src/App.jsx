import { useEffect, useState } from 'react'
import IntroView from './views/IntroView.jsx'
import ClusterView from './views/ClusterView.jsx'
import ApiTestView from './views/ApiTestView.jsx'
import ScreenerView from './views/ScreenerView.jsx'
import UniverseView from './views/UniverseView.jsx'

const VIEWS = [
  { id: 'intro', hash: '#/', label: '🏠 소개' },
  { id: 'cluster', hash: '#/cluster', label: '🧬 클러스터 결과' },
  { id: 'api', hash: '#/api-test', label: '🔌 API 테스트' },
  { id: 'screener', hash: '#/screener', label: '🎯 Screener 필터' },
  { id: 'universe', hash: '#/universe', label: '🧹 Universe 필터링' },
]

function viewFromHash() {
  const h = window.location.hash
  const found = VIEWS.find((v) => v.hash !== '#/' && h.startsWith(v.hash))
  return found ? found.id : 'intro'
}

function initialTheme() {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export default function App() {
  const [view, setView] = useState(viewFromHash)
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    const onHash = () => {
      setView(viewFromHash())
      if (window.location.hash.startsWith('#/')) window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const navigate = (id) => {
    window.location.hash = VIEWS.find((v) => v.id === id)?.hash ?? '#/'
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <a
            href="#/"
            className="nav-logo"
            onClick={() => setView('intro')}
          >
            📈 Stock Agent
          </a>
          <div className="nav-links">
            {VIEWS.map((v) => (
              <a
                key={v.id}
                href={v.hash}
                className={view === v.id ? 'active' : ''}
              >
                {v.label}
              </a>
            ))}
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="다크 모드 전환"
              title="다크 모드 전환"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {view === 'intro' && <IntroView dark={theme === 'dark'} onNavigate={navigate} />}
      {view === 'cluster' && <ClusterView />}
      {view === 'api' && <ApiTestView />}
      {view === 'screener' && <ScreenerView />}
      {view === 'universe' && <UniverseView />}

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
        <div className="copy">© 2026 Stock Agent — made with 💛 kakao yellow</div>
      </footer>
    </>
  )
}

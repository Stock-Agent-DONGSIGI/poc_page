import { useEffect, useRef } from 'react'

/**
 * TradingView Advanced Chart 위젯 임베드.
 * style: "1" = 캔들 차트
 */
export default function TradingViewChart({ symbol }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol,
      interval: 'D',
      timezone: 'Asia/Seoul',
      theme: 'light',
      style: '1',
      locale: 'kr',
      allow_symbol_change: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      autosize: true,
      support_host: 'https://www.tradingview.com',
    })
    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [symbol])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: '100%', width: '100%' }}
    />
  )
}

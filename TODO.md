# 세 가지 Dev. Mainstream (~8월 16일)

## 데이터 수집

- API 테스트
  - Reddit
  - Google News
  - SEC EDGAR
    - 단, penny stocks에 영향을 크게 주지는 않음.
    - 연결하면 좋으나 참고용
  - Yahoo Finance
    - Macro 정보…?
  - Google Map Street View
- Crawling
  - Nasdaq Screener
  - 기업 대표 사이트

## 데이터 가공 및 저장

- 임베딩 작업
- Clustering
  - DBSCAN
  - (t-SNE)
  - (UMAP)
- DB 적재
- Dasdaq Screener 기업별 tag 정리
  - **기업 전수 정리**
- EDGAR 최신 정리
  - 프론트엔드에서 바로 파악 가능하도록 정리
- 차트 변동
  - 상승률 상위 항목 기준으로 (하락률 보다는!)
  - 거래량
- 산업군 정리

## 알고리즘

```markdown
| 우선순위 | 방법                                   | 중요도 |
| -------- | -------------------------------------- | ------ |
| 1        | Daily Market Trend Analysis (Top-down) | ★★★★★  |
| 2        | Reddit Community Analysis              | ★★★★☆  |
| 3        | Macro / Policy Analysis                | ★★★★☆  |
| 4        | Influencer & Social Media Monitoring   | ★★★☆☆  |
```

- 우선순위…?
  - 소윤님 적어주신 것 기반으로
- 에이전트 Workflow 설계
- 가중치 적용
- LLM 적용 방안 고민
  - 분석 Comment 정리 방안
  - Model?
    - Open Source: Qwen (뉴스 번역용)
    - Proprietary Model: ChatGPT API (GPT 5.4 mini)
- 파생변수 설계
- 차트 분석 지표 적용
  - 금융 공학
  - 시계열 분석 방안 → 통계학적 분석 위주로. Penny Stocks에 적용하기에는 별로 효과가 X
  - 추가적인 조사 필요

# Main Part 완성 이후 (8월 중순 이후 PoC 단계)

- Architecture 설계
- 백엔드 설계
- 프론트엔드 설계
  - 대시보드?
  - API 연결
- 9월 전까지 마무리…?!

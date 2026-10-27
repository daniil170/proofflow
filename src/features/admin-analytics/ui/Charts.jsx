import PropTypes from 'prop-types'

export const DailyTrendChart = ({ data = [] }) => {
  if (!data || data.length === 0) return <div>Нет данных за выбранный период</div>

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const chartHeight = 160

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${data.length * 44 + 40} ${chartHeight + 40}`}
        style={{ width: '100%', minWidth: `${data.length * 36}px`, height: '200px' }}
      >
        {data.map((item, idx) => {
          const barHeight = Math.max((item.count / maxCount) * chartHeight, 4)
          const x = idx * 44 + 20
          const y = chartHeight - barHeight + 10

          return (
            <g key={item.date}>
              <rect
                x={x}
                y={y}
                width={28}
                height={barHeight}
                rx={4}
                fill="var(--color-accent, #d4ff3a)"
                opacity={item.count > 0 ? 0.9 : 0.2}
              />
              <text
                x={x + 14}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-text-primary, #ffffff)"
                fontWeight="bold"
              >
                {item.count > 0 ? item.count : ''}
              </text>
              <text
                x={x + 14}
                y={chartHeight + 26}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-text-secondary, #a1a1aa)"
              >
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

DailyTrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}

export const FunnelChart = ({ stages = [] }) => {
  if (!stages || stages.length === 0) return <div>Нет данных</div>

  const baseCount = stages[0]?.count || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {stages.map((st) => {
        const pct = baseCount > 0 ? Math.round((st.count / baseCount) * 100) : 0
        const barWidth = Math.max(pct, 4)

        return (
          <div key={st.stage} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>{st.label}</span>
              <span style={{ fontWeight: 'bold' }}>
                {st.count} ({pct}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '5px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${barWidth}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-accent, #d4ff3a)',
                  borderRadius: '5px',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

FunnelChart.propTypes = {
  stages: PropTypes.arrayOf(
    PropTypes.shape({
      stage: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}

export const HorizontalBarChart = ({ items = [] }) => {
  if (!items || items.length === 0) return <div>Нет данных</div>

  const total = items.reduce((acc, curr) => acc + curr.count, 0) || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      {items.map((item) => {
        const pct = Math.round((item.count / total) * 100)
        return (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
              <span style={{ fontWeight: '500' }}>
                {item.count} ({pct}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-accent, #d4ff3a)',
                  opacity: 0.85,
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

HorizontalBarChart.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}

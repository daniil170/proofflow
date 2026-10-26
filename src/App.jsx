export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.85rem',
        borderRadius: '9999px',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        color: '#16a34a',
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '1.5rem'
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
        Активная фаза валидации (CustDev)
      </div>

      <h1 style={{
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        fontWeight: 800,
        letterSpacing: '-0.025em',
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        ProofFlow
      </h1>

      <p style={{
        maxWidth: '640px',
        fontSize: '1.25rem',
        color: '#64748b',
        lineHeight: 1.6,
        marginBottom: '2rem'
      }}>
        AI-инструмент для автоматической упаковки сырого контента (созвонов, видео, скриншотов)
        в готовые B2B-кейсы и виджеты социального доказательства за 1 минуту.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        maxWidth: '800px',
        width: '100%',
        marginTop: '1rem'
      }}>
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>🎙️ Транскрибация</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Автоматическое распознавание речи созвонов и видео через Whisper.
          </p>
        </div>

        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>⚡ AI-Анализ & Кейсы</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Выделение болей, процесса и метрик в продающий текст силами Claude/GPT-4o.
          </p>
        </div>

        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>🧩 Embed Widget</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Интерактивный виджет отзывов и кейсов для вставки на сайт в один клик.
          </p>
        </div>
      </div>
    </div>
  )
}

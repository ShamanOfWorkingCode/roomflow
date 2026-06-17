import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getAnalytics } from '../api/client'

export default function AnalyticsPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'))
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'))

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getAnalytics(dateFrom, dateTo)
      setReport(data)
    } catch {
      setError('Не удалось загрузить аналитику')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="page-title">Аналитика</div>

      {/* Период */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>С</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>По</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn primary" onClick={load}>Применить</button>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading">Загрузка отчёта...</div>}

      {report && (
        <>
          {/* Карточки сверху */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard label="Всего броней" value={report.total_bookings} />
            <StatCard label="Пиковый час" value={peakHour(report.hour_stats)} />
            <StatCard label="Топ комната" value={report.room_popularity[0]?.room_name?.split('"')[1] || '—'} />
            <StatCard label="Топ отдел" value={report.department_stats[0]?.department || '—'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Рейтинг комнат */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Рейтинг комнат</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.room_popularity} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="room_name" type="category" width={90} tick={{ fontSize: 11 }}
                    tickFormatter={v => v.split('"')[1] || v} />
                  <Tooltip formatter={(v) => [v, 'Броней']} />
                  <Bar dataKey="total_bookings" radius={[0, 4, 4, 0]}>
                    {report.room_popularity.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#2563eb' : '#bfdbfe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* По отделам */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Активность по отделам</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.department_stats} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="department" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, 'Броней']} />
                  <Bar dataKey="total_bookings" radius={[0, 4, 4, 0]}>
                    {report.department_stats.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#16a34a' : '#bbf7d0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* По часам */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Нагрузка по часам дня</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={report.hour_stats}>
                <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={h => `${h}:00 – ${h + 1}:00`} formatter={v => [v, 'Броней']} />
                <Bar dataKey="total_bookings" radius={[4, 4, 0, 0]}>
                  {report.hour_stats.map((row, i) => (
                    <Cell key={i} fill={row.total_bookings === Math.max(...report.hour_stats.map(r => r.total_bookings)) ? '#2563eb' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

function peakHour(hourStats) {
  if (!hourStats?.length) return '—'
  const peak = hourStats.reduce((a, b) => a.total_bookings > b.total_bookings ? a : b)
  return `${peak.hour}:00`
}

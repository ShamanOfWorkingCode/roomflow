import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { getBookings, cancelBooking } from '../api/client'
import { useAuth } from '../context/AuthContext'

dayjs.locale('ru')

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await getBookings({ employee_id: user.id })
      setBookings(data)
    } catch {
      setError('Не удалось загрузить брони')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCancel(id) {
    if (!confirm('Отменить бронь?')) return
    try {
      await cancelBooking(id, user.id)
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Ошибка при отмене')
    }
  }

  const today = dayjs().format('YYYY-MM-DD')
  const upcoming = bookings.filter(b => b.booking_date >= today)
  const past = bookings.filter(b => b.booking_date < today)

  return (
    <div>
      <div className="page-title">Мои брони</div>
      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading">Загрузка...</div>}

      {!loading && bookings.length === 0 && (
        <div className="empty">У вас пока нет броней</div>
      )}

      {upcoming.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 10 }}>
            Предстоящие ({upcoming.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map(b => (
              <BookingRow key={b.id} booking={b} onCancel={handleCancel} canCancel />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 10 }}>
            История
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {past.map(b => (
              <BookingRow key={b.id} booking={b} onCancel={handleCancel} canCancel={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BookingRow({ booking: b, onCancel, canCancel }) {
  const isToday = b.booking_date === dayjs().format('YYYY-MM-DD')
  const dateLabel = isToday
    ? 'Сегодня'
    : dayjs(b.booking_date).format('D MMMM YYYY')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '12px 16px'
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8,
        background: 'var(--blue-light)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0
      }}>📅</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{b.room_name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
          {dateLabel} · {b.hour}:00 – {b.hour + 1}:00
        </div>
      </div>
      {isToday && <span className="badge green">Сегодня</span>}
      {canCancel && (
        <button className="btn danger" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => onCancel(b.id)}>
          Отменить
        </button>
      )}
    </div>
  )
}

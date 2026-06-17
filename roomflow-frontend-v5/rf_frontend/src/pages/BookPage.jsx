import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { getRooms, getAvailability, createBooking } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './BookPage.css'

export default function BookPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [slots, setSlots] = useState([])
  const [selectedHour, setSelectedHour] = useState(null)
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Загружаем список комнат
  useEffect(() => {
    getRooms().then(setRooms).catch(() => setError('Не удалось загрузить комнаты'))
  }, [])

  // Загружаем доступность когда выбрана комната или изменилась дата
  useEffect(() => {
    if (!selectedRoom) return
    setSlotsLoading(true)
    setSelectedHour(null)
    getAvailability(selectedRoom.id, date)
      .then(setSlots)
      .catch(() => setError('Не удалось проверить доступность'))
      .finally(() => setSlotsLoading(false))
  }, [selectedRoom, date])

  async function handleBook() {
    if (!selectedRoom || !selectedHour) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await createBooking({
        room_id: selectedRoom.id,
        employee_id: user.id,
        booking_date: date,
        hour: selectedHour,
      })
      setSuccess(`Готово! Забронировано: ${selectedRoom.name}, ${selectedHour}:00`)
      setSelectedHour(null)
      // Обновляем слоты
      const updated = await getAvailability(selectedRoom.id, date)
      setSlots(updated)
    } catch (e) {
      setError(e.response?.data?.detail || 'Ошибка при бронировании')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-title">Забронировать комнату</div>

      {/* Фильтр по дате */}
      <div className="book-filters">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Дата</label>
          <input
            type="date"
            value={date}
            min={dayjs().format('YYYY-MM-DD')}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="book-layout">
        {/* Список комнат */}
        <div className="rooms-list">
          <div className="section-label">Выберите комнату</div>
          {rooms.length === 0 && <div className="loading">Загрузка...</div>}
          {rooms.map(room => (
            <div
              key={room.id}
              className={`room-card ${selectedRoom?.id === room.id ? 'selected' : ''}`}
              onClick={() => { setSelectedRoom(room); setError(''); setSuccess('') }}
            >
              <div className="room-card-header">
                <span className="room-card-name">{room.name}</span>
                <span className="badge blue">до {room.capacity} чел.</span>
              </div>
              <div className="room-card-meta">{room.floor} этаж · {room.features}</div>
            </div>
          ))}
        </div>

        {/* Слоты */}
        <div className="slots-panel">
          {!selectedRoom ? (
            <div className="empty">← Выберите комнату слева</div>
          ) : (
            <>
              <div className="section-label">
                Доступные часы — {dayjs(date).format('D MMMM YYYY')}
              </div>
              {slotsLoading ? (
                <div className="loading">Проверяем доступность...</div>
              ) : (
                <div className="slots-grid">
                  {slots.map(slot => (
                    <button
                      key={slot.hour}
                      className={`slot ${!slot.is_free ? 'booked' : ''} ${selectedHour === slot.hour ? 'selected' : ''}`}
                      disabled={!slot.is_free}
                      onClick={() => setSelectedHour(slot.hour)}
                      title={slot.booked_by ? `Занято: ${slot.booked_by}` : ''}
                    >
                      <span className="slot-time">{slot.hour}:00</span>
                      <span className="slot-status">
                        {slot.is_free ? 'свободно' : slot.booked_by || 'занято'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedHour && (
                <div className="confirm-panel">
                  <div className="confirm-info">
                    <span>📌 {selectedRoom.name}</span>
                    <span>📅 {dayjs(date).format('D MMM')}</span>
                    <span>🕐 {selectedHour}:00 – {selectedHour + 1}:00</span>
                  </div>
                  <button
                    className="btn primary"
                    onClick={handleBook}
                    disabled={loading}
                  >
                    {loading ? 'Бронируем...' : 'Подтвердить бронь'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

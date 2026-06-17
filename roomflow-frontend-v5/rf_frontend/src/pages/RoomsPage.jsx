import { useState, useEffect } from 'react'
import { getRooms, createRoom } from '../api/client'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', capacity: '', floor: '', features: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setRooms(await getRooms())
    } catch {
      setError('Не удалось загрузить комнаты')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createRoom({ ...form, capacity: +form.capacity, floor: +form.floor })
      setShowForm(false)
      setForm({ name: '', capacity: '', floor: '', features: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Все комнаты</div>
        <button className="btn primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Добавить комнату'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Новая комната</div>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label>Название</label>
                <input required placeholder='Переговорная "Альфа"' value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Вместимость (чел.)</label>
                <input required type="number" min="1" placeholder="8" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Этаж</label>
                <input required type="number" min="1" placeholder="3" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Оборудование</label>
                <input placeholder="Проектор, ТВ, Whiteboard" value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} />
              </div>
            </div>
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </form>
        </div>
      )}

      {loading && <div className="loading">Загрузка...</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rooms.map(room => (
          <div key={room.id} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '14px 18px'
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'var(--blue-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
            }}>🚪</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{room.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                {room.floor} этаж · до {room.capacity} чел. · {room.features || 'без доп. оборудования'}
              </div>
            </div>
            <span className={`badge ${room.is_active ? 'green' : 'red'}`}>
              {room.is_active ? 'Активна' : 'Закрыта'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

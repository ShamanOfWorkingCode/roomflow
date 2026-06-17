import axios from 'axios'

// Базовый URL — через vite proxy идёт на localhost:8000
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Комнаты ──────────────────────────────────────────────
export const getRooms = () =>
  api.get('/rooms/').then(r => r.data)

export const createRoom = (data) =>
  api.post('/rooms/', data).then(r => r.data)

// ── Сотрудники ───────────────────────────────────────────
export const getEmployees = () =>
  api.get('/employees/').then(r => r.data)

export const createEmployee = (data) =>
  api.post('/employees/', data).then(r => r.data)

// ── Доступность слотов ───────────────────────────────────
export const getAvailability = (roomId, date) =>
  api.get('/bookings/availability', {
    params: { room_id: roomId, booking_date: date },
  }).then(r => r.data)

// ── Бронирование ─────────────────────────────────────────
export const createBooking = (data) =>
  api.post('/bookings/', data).then(r => r.data)

export const getBookings = (params = {}) =>
  api.get('/bookings/', { params }).then(r => r.data)

export const cancelBooking = (bookingId, employeeId) =>
  api.delete(`/bookings/${bookingId}`, {
    params: { employee_id: employeeId },
  }).then(r => r.data)

// ── Аналитика ─────────────────────────────────────────────
export const getAnalytics = (dateFrom, dateTo) =>
  api.get('/analytics/report', {
    params: { date_from: dateFrom, date_to: dateTo },
  }).then(r => r.data)

// ── Авторизация ───────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

export const register = (data) =>
  api.post('/auth/register', data).then(r => r.data)

// ── Календарь отсутствий ─────────────────────────────────
export const getCalendar = (dateFrom, dateTo) =>
  api.get('/calendar/', {
    params: { date_from: dateFrom, date_to: dateTo },
  }).then(r => r.data)

export const getWhoIsOutToday = () =>
  api.get('/calendar/today').then(r => r.data)

export const addVacationDays = (data) =>
  api.post('/calendar/', data).then(r => r.data)

export const removeVacationDay = (employeeId, date, requesterId, requesterIsManager) =>
  api.delete(`/calendar/${employeeId}/${date}`, {
    params: { requester_id: requesterId, requester_is_manager: requesterIsManager },
  }).then(r => r.data)

// ── Личные задачи в календаре ────────────────────────────
export const getTasks = (params = {}) =>
  api.get('/tasks/', { params }).then(r => r.data)

export const createTask = (data) =>
  api.post('/tasks/', data).then(r => r.data)

export const deleteTask = (taskId, employeeId) =>
  api.delete(`/tasks/${taskId}`, {
    params: { employee_id: employeeId },
  }).then(r => r.data)

export default api

import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'roomflow_user'

export function AuthProvider({ children }) {
  // Простая схема: после логина храним сотрудника в state.
  // Дублируем в sessionStorage только чтобы не разлогиниваться при обновлении страницы —
  // это не токен, просто публичные данные профиля (id, имя, отдел, флаг менеджера).
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  function loginUser(employee) {
    setUser(employee)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(employee))
  }

  function logoutUser() {
    setUser(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider')
  return ctx
}

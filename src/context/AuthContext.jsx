import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// El paciente introduce su teléfono pero Supabase internamente usa email
// Esto es transparente para el usuario — solo ve el campo de teléfono
function phoneToEmail(phone) {
  const clean = phone.replace(/\s/g, '').replace(/^\+/, '')
  return `${clean}@anantara.local`
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPatient(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await fetchPatient(session.user.id)
        else { setPatient(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchPatient(userId) {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('id', userId)
      .single()
    setPatient(data)
    setLoading(false)
  }

  // Crear cuenta nueva: teléfono + nombre + contraseña
  async function signUp(phone, fullName, password) {
    const email = phoneToEmail(phone)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } }
    })
    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('Este teléfono ya tiene una cuenta. Inicia sesión.')
      }
      throw error
    }
    // Actualizar perfil con nombre y teléfono real
    if (data.user) {
      await supabase.from('patients').update({
        full_name: fullName,
        phone: phone.replace(/\s/g, '')
      }).eq('id', data.user.id)
    }
    return data
  }

  // Entrar: teléfono + contraseña
  async function signIn(phone, password) {
    const email = phoneToEmail(phone)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login')) {
        throw new Error('Teléfono o contraseña incorrectos')
      }
      throw error
    }
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setPatient(data)
    return data
  }

  return (
    <AuthContext.Provider value={{
      user,
      patient,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

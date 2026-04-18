import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMessages = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (err) throw err
      setMessages(data || [])
      return data || []
    } catch (err) {
      console.error('fetchMessages error:', err)
      setError(err)
      setMessages([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createMessage = useCallback(async (messageData) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const senderName = user?.email?.split('@')[0] || 'Admin'
      const senderEmail = user?.email || null

      const { data: message, error: err } = await supabase
        .from('pm_messages')
        .insert([{
          ...messageData,
          sender_name: messageData.sender_name || senderName,
          sender_email: messageData.sender_email || senderEmail,
        }])
        .select()
        .single()

      if (err) throw err
      return message
    } catch (err) {
      console.error('createMessage error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteMessage = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_messages')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteMessage error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    messages,
    loading,
    error,
    fetchMessages,
    createMessage,
    deleteMessage,
  }
}

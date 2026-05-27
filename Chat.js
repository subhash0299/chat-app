import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Chat({ session }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const bottomRef = useRef(null)
  const username = session.user.user_metadata?.username || session.user.email.split('@')[0]

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (!currentRoom) return
    fetchMessages()
    const channel = supabase
      .channel(`room-${currentRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${currentRoom.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [currentRoom])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('created_at')
    if (data && data.length > 0) {
      setRooms(data)
      setCurrentRoom(data[0])
    }
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', currentRoom.id)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentRoom) return
    const msg = newMessage.trim()
    setNewMessage('')
    await supabase.from('messages').insert({
      content: msg,
      room_id: currentRoom.id,
      user_id: session.user.id,
      username,
    })
  }

  const createRoom = async (e) => {
    e.preventDefault()
    if (!newRoomName.trim()) return
    const { data } = await supabase
      .from('rooms')
      .insert({ name: newRoomName.trim(), created_by: session.user.id })
      .select()
      .single()
    if (data) {
      setRooms((prev) => [...prev, data])
      setCurrentRoom(data)
      setNewRoomName('')
      setShowNewRoom(false)
    }
  }

  const signOut = () => supabase.auth.signOut()

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isMe = (msg) => msg.user_id === session.user.id

  const getInitials = (name) => name.slice(0, 2).toUpperCase()

  const avatarColor = (name) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981']
    let hash = 0
    for (let c of name) hash = (hash + c.charCodeAt(0)) % colors.length
    return colors[hash]
  }

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.appName}>💬 ChatRoom</span>
          <button style={styles.iconBtn} onClick={signOut} title="Sign out">✕</button>
        </div>

        <div style={styles.userBadge}>
          <div style={{ ...styles.avatar, background: avatarColor(username), fontSize: '0.7rem' }}>
            {getInitials(username)}
          </div>
          <span style={styles.usernameText}>{username}</span>
        </div>

        <div style={styles.sectionLabel}>Rooms</div>
        <div style={styles.roomList}>
          {rooms.map((room) => (
            <button
              key={room.id}
              style={{ ...styles.roomBtn, ...(currentRoom?.id === room.id ? styles.activeRoom : {}) }}
              onClick={() => setCurrentRoom(room)}
            >
              # {room.name}
            </button>
          ))}
        </div>

        {showNewRoom ? (
          <form onSubmit={createRoom} style={styles.newRoomForm}>
            <input
              style={styles.smallInput}
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" style={styles.smallBtn}>Create</button>
              <button type="button" style={{ ...styles.smallBtn, background: '#2a2a2a' }}
                onClick={() => setShowNewRoom(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button style={styles.newRoomBtn} onClick={() => setShowNewRoom(true)}>
            + New room
          </button>
        )}
      </div>

      <div style={styles.main}>
        <div style={styles.topBar}>
          <span style={styles.roomTitle}># {currentRoom?.name || 'Select a room'}</span>
        </div>

        <div style={styles.messages}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              No messages yet. Say hello! 👋
            </div>
          )}
          {messages.map((msg, i) => {
            const me = isMe(msg)
            const showAvatar = i === 0 || messages[i - 1]?.username !== msg.username
            return (
              <div key={msg.id} style={{ ...styles.msgRow, justifyContent: me ? 'flex-end' : 'flex-start' }}>
                {!me && (
                  <div style={{ ...styles.avatar, background: avatarColor(msg.username), visibility: showAvatar ? 'visible' : 'hidden' }}>
                    {getInitials(msg.username)}
                  </div>
                )}
                <div style={{ maxWidth: '65%' }}>
                  {!me && showAvatar && (
                    <div style={styles.msgUsername}>{msg.username}</div>
                  )}
                  <div style={{ ...styles.bubble, ...(me ? styles.myBubble : styles.theirBubble) }}>
                    {msg.content}
                  </div>
                  <div style={{ ...styles.msgTime, textAlign: me ? 'right' : 'left' }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
                {me && (
                  <div style={{ ...styles.avatar, background: avatarColor(username) }}>
                    {getInitials(username)}
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} style={styles.inputRow}>
          <input
            style={styles.messageInput}
            placeholder={currentRoom ? `Message #${currentRoom.name}` : 'Select a room first'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!currentRoom}
          />
          <button style={styles.sendBtn} type="submit" disabled={!currentRoom || !newMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    background: '#0f0f0f',
    color: '#fff',
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    minWidth: '240px',
    background: '#161616',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    overflow: 'hidden',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: '1px solid #2a2a2a',
  },
  appName: {
    fontWeight: '600',
    fontSize: '1rem',
    color: '#fff',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '4px',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #2a2a2a',
  },
  usernameText: {
    fontSize: '0.875rem',
    color: '#ccc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sectionLabel: {
    fontSize: '0.7rem',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '1rem 1rem 0.4rem',
  },
  roomList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 0.5rem',
  },
  roomBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.5rem 0.75rem',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginBottom: '2px',
    transition: 'all 0.15s',
  },
  activeRoom: {
    background: '#2a2a2a',
    color: '#fff',
  },
  newRoomForm: {
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid #2a2a2a',
  },
  smallInput: {
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    padding: '0.4rem 0.6rem',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
  },
  smallBtn: {
    flex: 1,
    background: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    padding: '0.4rem',
    color: '#fff',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  newRoomBtn: {
    margin: '0.75rem',
    padding: '0.5rem',
    background: 'none',
    border: '1px dashed #2a2a2a',
    borderRadius: '6px',
    color: '#555',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.15s',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    padding: '0.85rem 1.25rem',
    borderBottom: '1px solid #2a2a2a',
    background: '#161616',
  },
  roomTitle: {
    fontWeight: '500',
    fontSize: '0.95rem',
    color: '#ccc',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#444',
    fontSize: '0.9rem',
    marginTop: '4rem',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '2px',
  },
  avatar: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontWeight: '600',
    color: '#fff',
  },
  msgUsername: {
    fontSize: '0.75rem',
    color: '#666',
    marginBottom: '3px',
    paddingLeft: '2px',
  },
  bubble: {
    padding: '0.5rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },
  myBubble: {
    background: '#6366f1',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  theirBubble: {
    background: '#1e1e1e',
    color: '#e5e5e5',
    borderBottomLeftRadius: '4px',
    border: '1px solid #2a2a2a',
  },
  msgTime: {
    fontSize: '0.7rem',
    color: '#444',
    marginTop: '3px',
    paddingLeft: '2px',
    paddingRight: '2px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    padding: '1rem 1.25rem',
    borderTop: '1px solid #2a2a2a',
    background: '#161616',
  },
  messageInput: {
    flex: 1,
    background: '#1e1e1e',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '0.65rem 1rem',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
  },
  sendBtn: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0 1.25rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background 0.2s',
  },
}
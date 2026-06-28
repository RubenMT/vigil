import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function generateId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = 'VGL-'
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { owner_email, encrypted_body, passphrase_hash, recipients } = req.body

  if (!owner_email || !encrypted_body || !passphrase_hash || !recipients?.length) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const id = generateId()

  const { error: vigilError } = await supabase
    .from('vigils')
    .insert({ id, owner_email, encrypted_body, passphrase_hash })

  if (vigilError) return res.status(500).json({ error: vigilError.message })

  const recipientRows = recipients.map(r => ({
    vigil_id: id, email: r.email, name: r.name
  }))

  const { error: recError } = await supabase
    .from('recipients')
    .insert(recipientRows)

  if (recError) return res.status(500).json({ error: recError.message })

  return res.status(201).json({ id })
}

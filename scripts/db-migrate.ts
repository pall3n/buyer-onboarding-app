import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.')
  console.error('Add it to .env.local — Supabase dashboard → Settings → Database → Connection string → URI')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { max: 1 })

const migrationsDir = path.join(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..', 'supabase', 'migrations')

async function run() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No migration files found in', migrationsDir)
    await sql.end()
    return
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    console.log(`Running migration: ${file}`)
    try {
      await sql.unsafe(content)
      console.log(`  ✓ ${file}`)
    } catch (err) {
      console.error(`  ✗ ${file}:`, err)
      await sql.end()
      process.exit(1)
    }
  }

  console.log('\nAll migrations completed successfully.')
  await sql.end()
}

run().catch(async (err) => {
  console.error('Migration runner error:', err)
  await sql.end()
  process.exit(1)
})

import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('trucks').select('*')
  console.log('Supabase connected:', !error)
  
  return (
    <main>
      <h1>Taco Truck Platform</h1>
      <p>Supabase status: {error ? 'Error - ' + error.message : 'Connected ✓'}</p>
    </main>
  )
}
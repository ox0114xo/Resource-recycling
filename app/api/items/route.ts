import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, unit, categories(name)')
    .order('sort_order')

  if (error) return NextResponse.json([], { status: 500 })

  const items = data.map((i: any) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    category: i.categories?.name ?? '',
  }))

  return NextResponse.json(items)
}

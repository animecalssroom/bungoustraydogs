import { NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

export function validate<T>(schema: ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: e.errors[0]?.message ?? 'Validation failed' },
          { status: 400 }
        ),
      }
    }
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid input' }, { status: 400 }),
    }
  }
}

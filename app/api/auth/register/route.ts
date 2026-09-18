import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : ''
    const password = typeof data?.password === 'string' ? data.password : ''
    const name = typeof data?.name === 'string' ? data.name.trim() : null

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Введите корректный адрес электронной почты' },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать не менее 8 символов' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже зарегистрирован' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    return NextResponse.json(
      { error: 'Не удалось зарегистрировать пользователя' },
      { status: 500 }
    )
  }
}

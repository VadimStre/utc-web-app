// Сид только если в базе нет записей (безопасно для рестартов контейнера)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  if (users === 0) {
    const hash = await bcrypt.hash('Admin12345!', 10);
    await prisma.user.create({
      data: {
        id: 'admin-default',
        email: 'admin@utc.local',
        passwordHash: hash,
        name: 'Администратор',
        role: 'ADMIN',
      },
    });
    console.log('✅ Создан администратор admin@utc.local / Admin12345! (СМЕНИТЕ ПАРОЛЬ!)');
  } else {
    console.log('ℹ️  Пользователи уже есть — пропускаем сид юзеров');
  }

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    await prisma.appSettings.create({ data: { id: 1 } });
    console.log('✅ Созданы настройки приложения (llmProvider=cloud)');
  } else {
    console.log('ℹ️  Настройки уже есть — пропускаем');
  }
}

main()
  .catch((e) => {
    console.error('❌ Ошибка seed-if-empty:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

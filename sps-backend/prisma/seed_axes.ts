import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const axes = [
        { id: '1', name: 'Governança e Gestão', color: 'blue' },
        { id: '2', name: 'Saúde e Qualidade de Vida', color: 'rose' },
        { id: '3', name: 'Educação, Cultura e Esporte', color: 'amber' },
        { id: '4', name: 'Desenvolvimento Econômico e Geração de Renda', color: 'emerald' },
        { id: '5', name: 'Infraestrutura e Mobilidade', color: 'slate' },
        { id: '6', name: 'Meio Ambiente e Sustentabilidade', color: 'green' },
    ];

    console.log('Seeding Axes...');
    for (const axis of axes) {
        await prisma.axis.upsert({
            where: { id: axis.id },
            update: axis,
            create: axis,
        });
        console.log(`Upserted axis: ${axis.name}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

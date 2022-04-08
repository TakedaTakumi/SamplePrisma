import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	const allCountry = await prisma.country.findMany();
	console.log({ allCountry });
}

main()
	.catch((e) => {
		throw e;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

// @ts-ignore
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


test('insert data', async () => {
	const katsuo = await prisma.user.create({
		data: {
			name: '磯野 カツオ',
			age: 11,
			posts: {
				create: [
					{
						title: 'はじめてのTypeScript（+TypeScript ESLint、Prettier、Emacs lsp-mode）',
						url: 'https://kazuhira-r.hatenablog.com/entry/2021/10/30/222106',
					},
					{
						title: 'JestでTypeScriptのテストを書く',
						url: 'https://kazuhira-r.hatenablog.com/entry/2021/10/31/173852',
					},
					{
						title: 'TypeScriptでExpress',
						url: 'https://kazuhira-r.hatenablog.com/entry/2021/11/20/184345',
					},
				]
			}
		}
	})

	console.log({katsuo});
	expect(katsuo.name).toEqual('磯野 カツオ');
	expect(katsuo.age).toBe(11);

	const wakame = await prisma.user.create({
		data: {
			name: '磯野 ワカメ',
			age: 9
		}
	})

	console.log({wakame});
	expect(wakame.name).toEqual('磯野 ワカメ');
	expect(wakame.age).toBe(9)

	const createdPosts = await prisma.post.createMany({
		data: [
			{
				title: 'Node.jsの管理ツール、nvmをインストールする',
				url: 'https://kazuhira-r.hatenablog.com/entry/2021/03/22/223042',
				userId: wakame.id,
			},
			{
				title: 'Node.jsアプリケーションのログ出力に、winstonを使ってみる',
				url: 'https://kazuhira-r.hatenablog.com/entry/2019/05/21/235843',
				userId: wakame.id,
			},
		]
	})

	console.log({createdPosts});
	expect(createdPosts.count).toBe(2);

})

test('search single data', async () => {
	const katsuo = await prisma.user.findFirst({
		where: { name: '磯野 カツオ' }
	})
	console.log({katsuo});
	expect(katsuo?.age).toBe(11);

	if(katsuo?.id) {
		const katsuo2 = await prisma.user.findUnique({ where: {id: katsuo?.id}});
		console.log({katsuo2});
		expect(katsuo2).not.toBeNull();
	} else {
		throw new Error('katuso is null');
	}
})

test('search related data', async () => {
	const katsuo = await prisma.user.findFirst({
		where: {name:'磯野 カツオ'},
		include: {posts: true}
	})
	console.log({katsuo});
	expect(katsuo?.age).toBe(11)

	if(katsuo?.id) {
		const katsuoIncludePosts = await prisma.user.findUnique({
			where: {id: katsuo?.id},
			include: {posts: {orderBy: {url: 'desc'}}},
		})
		console.log({katsuoIncludePosts});

		expect(katsuoIncludePosts).not.toBe(null);
		expect(katsuoIncludePosts && katsuoIncludePosts?.posts).toHaveLength(3);
		expect(katsuoIncludePosts && katsuoIncludePosts?.posts[0] && katsuoIncludePosts?.posts[0].title).toEqual('TypeScriptでExpress');
		expect(katsuoIncludePosts && katsuoIncludePosts?.posts[0] && katsuoIncludePosts?.posts[0].url).toEqual('https://kazuhira-r.hatenablog.com/entry/2021/11/20/184345');
	} else {
		throw new Error('katuso is null');
	}
})

test('transaction rollback',async () => {
	const katsuo = await prisma.user.findFirst({
		where: { name: '磯野 カツオ'}
	})

	if(katsuo) {
		const currentCount = await prisma.post.count();
		console.log({currentCount});
		expect(currentCount).toBe(5);

		try {
			const [post1, post2] = await prisma.$transaction([
				prisma.post.create({
					data: {
						title: 'TypeScript＋Node.jsで、Echo Server／Clientを書いてみる',
						url: 'https://kazuhira-r.hatenablog.com/entry/2021/11/20/222927',
						userId: katsuo.id,
					}
				}),
				prisma.post.create({
					data: {
						title: 'TypeScriptでExpress',
						url: 'https://kazuhira-r.hatenablog.com/entry/2021/11/20/184345',
						userId: katsuo.id,
					},
				})
			])

			expect(post1).not.toBeNull();
			expect(post2).not.toBeNull();

			const rollbackedCount = await prisma.post.count();
			expect(rollbackedCount).toBe(5);
		}catch(e) {
			expect((e as Error).message).toContain(
				'Unique constraint failed on the constraint: `post_url_key`'
			)
		}
	} else {
		throw new Error('katuso is null');
	}
})

test('transaction commit', async () => {
	const katsuo = await prisma.user.findFirst({
		where: {name: '磯野 カツオ'}
	})

	if(katsuo) {
		const currentCount = await prisma.post.count();
		expect(currentCount).toBe(5);

		const [post1, post2] = await prisma.$transaction([
			prisma.post.create({
			data: {
				title: 'TypeScript＋Node.jsで、Echo Server／Clientを書いてみる',
				url: 'https://kazuhira-r.hatenablog.com/entry/2021/11/20/222927',
				userId: katsuo.id,
			},
			}),
			prisma.post.create({
			data: {
				title:
				'TypeScript＋Node.jsプロジェクトを自動ビルドする（--watch、nodemon＋ts-node）',
				url: 'https://kazuhira-r.hatenablog.com/entry/2021/11/28/221448',
				userId: katsuo.id,
			},
			}),
		])

		expect(post1).not.toBeNull();
		expect(post2).not.toBeNull();

		const committedCount = await prisma.post.count();
		expect(committedCount).toBe(7);
	}else {
		throw new Error('katsuo is null')
	}
})

test('delete data', async () => {
	const deletedPosts = await prisma.post.deleteMany();
	const deletedUsers = await prisma.user.deleteMany();

	expect(deletedPosts.count).toBe(7);
	expect(deletedUsers.count).toBe(2);
})

import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

async function getData() {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL environment variable is not set')
	}

	try {
		const sql = neon(process.env.DATABASE_URL)
		const response =
			await sql`SELECT * FROM "github metrics"."github-metrics" ORDER BY id ASC LIMIT 1`
		return response[0]
	} catch (error) {
		console.error('Error fetching data:', error)
		throw new Error('Failed to fetch data from the database')
	}
}

export default async function Home() {
	const data = await getData()
	return (
		<div className='flex flex-col items-center justify-center min-h-screen'>
			<div className='flex flex-col items-center justify-center border-2 rounded-lg p-6 shadow-lg max-w-md w-full text-xl'>
				<ul>
					<li>
						<span className='font-bold'>{data.commits}</span> total commits!
					</li>
					<li>
						<span className='font-bold'>{data.repos}</span> total repos!
					</li>
				</ul>
			</div>
		</div>
	)
}

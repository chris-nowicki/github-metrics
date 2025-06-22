import { getGitHubMetrics } from '@/lib/neondb-service'
import type { GitHubMetrics } from '@/lib/neondb-service'

export const dynamic = 'force-dynamic'

export default async function Home() {
	const data: GitHubMetrics | null = await getGitHubMetrics()

	if (!data) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen'>
				<div className='flex flex-col items-center justify-center border-2 rounded-lg p-6 shadow-lg max-w-md w-full text-xl'>
					<p>No GitHub metrics available.</p>
				</div>
			</div>
		)
	}
	return (
		<div className='flex flex-col items-center justify-center min-h-screen'>
			<div className='flex flex-col items-center justify-center border-2 rounded-lg p-6 shadow-lg max-w-md w-full text-xl'>
				<ul>
					<li>
						<span className='font-bold'>{data.commits || 0}</span> total
						commits!
					</li>
					<li>
						<span className='font-bold'>{data.repos || 0}</span> total repos!
					</li>
				</ul>
			</div>
		</div>
	)
}

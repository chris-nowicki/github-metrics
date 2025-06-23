import { getGitHubMetrics } from '@/lib/neondb-service'
import type { GitHubMetrics } from '@/lib/neondb-service'
import { FaGithub } from 'react-icons/fa'
import { HiDocumentText } from 'react-icons/hi2'
import { FaCodeBranch, FaFolder } from 'react-icons/fa'

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
		<div className='flex flex-col items-center justify-center'>
			<div className='flex flex-col max-w-xl mx-auto'>
				<div className='flex flex-col justify-center mt-12 mb-8 w-full gap-4'>
					<h1 className='text-2xl font-bold md:text-4xl'>
						Vercel Cron Job Demo
					</h1>
					<p className='text-base'>
						This demo showcases how to use Vercel Cron Jobs to efficiently
						display GitHub metrics on your website. Instead of fetching data
						from GitHub's API on every page load (which would be slow and
						expensive), this application uses scheduled background jobs to
						periodically update a database with the latest commit counts. The
						result is fast page loads while keeping data fresh.
					</p>
					<div className='flex gap-3 mt-4'>
						<a
							href='https://github.com/chris-nowicki/github-metrics'
							target='_blank'
							rel='noopener noreferrer'
							className='inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors duration-200 w-fit'
						>
							<FaGithub className='w-5 h-5' />
							View Code
						</a>
					</div>
				</div>
				<div className='rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm max-w-md w-full mt-4'>
					<div className='flex flex-col space-y-1.5 p-6 pb-3'>
						<h3 className='text-lg font-semibold leading-none tracking-tight'>
							GitHub Metrics
						</h3>
						<p className='text-sm text-gray-600'>
							Live data from{' '}
							<a
								href='https://github.com/chris-nowicki'
								className='text-blue-600 hover:underline'
								target='_blank'
								rel='noopener noreferrer'
							>
								chris nowicki's
							</a>{' '}
							repositories
						</p>
					</div>
					<div className='p-6 pt-0 space-y-4'>
						<div className='flex items-center space-x-4 rounded-md border border-gray-200 p-4'>
							<FaCodeBranch className='h-4 w-4 text-blue-600' />
							<div className='flex-1 space-y-1'>
								<p className='text-sm font-medium leading-none'>
									Total Commits
								</p>
								<p className='text-xs text-gray-600'>Across all repositories</p>
							</div>
							<div className='text-2xl font-bold'>{data.commits}</div>
						</div>
						<div className='flex items-center space-x-4 rounded-md border border-gray-200 p-4'>
							<FaFolder className='h-4 w-4 text-green-600' />
							<div className='flex-1 space-y-1'>
								<p className='text-sm font-medium leading-none'>
									Total Repositories
								</p>
								<p className='text-xs text-gray-600'>
									Public and private repos
								</p>
							</div>
							<div className='text-2xl font-bold'>{data.repos}</div>
						</div>
					</div>
				</div>
				<span className='text-sm my-2'>
					made with ❤️ by{' '}
					<a
						href='https://www.chrisnowicki.dev'
						className='hover:text-blue-600 hover:underline'
						target='_blank'
						rel='noopener noreferrer'
					>
						Chris Nowicki
					</a>
				</span>
			</div>
		</div>
	)
}

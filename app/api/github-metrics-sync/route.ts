import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { updateGitHubMetrics } from '@/lib/neondb-service'

export async function GET(request: NextRequest) {
	try {
		// Verify the request is from your cron service
		const authHeader = request.headers.get('authorization')
		if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Initialize Octokit
		const octokit = new Octokit({
			auth: process.env.GITHUB_TOKEN,
		})

		// Get authenticated user
		const { data: authenticatedUser } = await octokit.request('GET /user')
		const username = authenticatedUser.login
		console.log(`Fetching commits for user: ${username}`)

		// Fetch all repositories with pagination
		console.log('Fetching user repositories...')
		const allRepos = []
		let page = 1
		let hasMorePages = true

		while (hasMorePages) {
			const repos = await octokit.request('GET /user/repos', {
				per_page: 100,
				page: page,
				affiliation: 'owner',
			})

			console.log(`Fetched page ${page}: ${repos.data.length} repositories`)
			allRepos.push(...repos.data)
			hasMorePages = repos.data.length === 100
			page++

			if (hasMorePages) {
				await new Promise((resolve) => setTimeout(resolve, 100))
			}
		}

		const totalRepos = allRepos.length
		console.log(`Found ${totalRepos} repositories across ${page - 1} pages`)

		// Process repositories and count commits
		let totalCommits = 0
		let processedRepos = 0
		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms))

		for (const repo of allRepos) {
			try {
				await delay(100)

				console.log(`Processing repository: ${repo.name}`)

				const contributors = await octokit.request(
					'GET /repos/{owner}/{repo}/contributors',
					{
						owner: repo.owner.login,
						repo: repo.name,
					}
				)

				const ourContribution = contributors.data.find(
					(contributor) => contributor.login === username
				)

				if (ourContribution) {
					totalCommits += ourContribution.contributions
					console.log(
						`Added ${ourContribution.contributions} commits from ${repo.name}`
					)
				}

				processedRepos++
			} catch (repoError) {
				console.warn(
					`Failed to fetch commits for repository ${repo.name}:`,
					repoError instanceof Error ? repoError.message : String(repoError)
				)
				continue
			}
		}

		console.log(
			`Successfully processed ${processedRepos}/${totalRepos} repositories`
		)
		console.log(`Total commits found: ${totalCommits}`)

		// Update database
		console.log('Updating database with new metrics...')
		await updateGitHubMetrics(totalCommits, allRepos.length)

		return NextResponse.json({
			success: true,
			username: username,
			totalCommits: totalCommits,
			totalRepos: allRepos.length,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		console.error('GitHub Metrics Cron Job failed:', error)
		return NextResponse.json(
			{ error: 'GitHub Metrics Cron Job Failed' },
			{ status: 500 }
		)
	}
}

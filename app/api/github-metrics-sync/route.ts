import { Octokit } from '@octokit/rest'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	try {
		// Verify the request is from your cron service
		const authHeader = request.headers.get('authorization')
		if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const octokit = new Octokit({
			auth: process.env.GITHUB_TOKEN,
		})

		// Step 1: Fetch all repositories owned by the authenticated user
		// Using per_page: 100 to minimize API calls (max is 100)
		// affiliation: 'owner' ensures we only get repos we own, not ones we collaborate on
		console.log('Fetching user repositories...')
		const repos = await octokit.request('GET /user/repos', {
			per_page: 100,
			affiliation: 'owner',
		})

		// Step 2: Count total repositories
		const totalRepos = repos.data.length
		console.log(`Found ${totalRepos} repositories`)

		// Step 3: Get authenticated user info to avoid hardcoding username
		const { data: authenticatedUser } = await octokit.request('GET /user')
		const username = authenticatedUser.login
		console.log(`Fetching commits for user: ${username}`)

		// Step 4: Initialize commit counter and process each repository
		let totalCommits = 0
		let processedRepos = 0

		// Helper function to add delay between API calls to respect rate limits
		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms))

		// Loop through each repository to count contributions
		for (const repo of repos.data) {
			try {
				// Add small delay to avoid hitting rate limits too aggressively
				// GitHub allows 5,000 requests/hour, so 100ms delay gives us plenty of headroom
				await delay(100)

				console.log(`Processing repository: ${repo.name}`)

				// Step 5: Fetch contributors for current repository
				// This endpoint returns contribution counts for each contributor
				const contributors = await octokit.request(
					'GET /repos/{owner}/{repo}/contributors',
					{
						owner: repo.owner.login,
						repo: repo.name,
					}
				)

				// Step 6: Find our contributions in the contributors list
				// Only count commits from the authenticated user
				if (contributors.data.length > 0) {
					for (const contributor of contributors.data) {
						if (contributor.login === username) {
							totalCommits += contributor.contributions
							console.log(
								`Added ${contributor.contributions} commits from ${repo.name}`
							)
							break // Found our contributions, no need to continue loop
						}
					}
				}

				processedRepos++
			} catch (repoError) {
				// Handle individual repository errors gracefully
				// Some repos might be private, archived, or have other access issues
				console.warn(
					`Failed to fetch commits for repository ${repo.name}:`,
					repoError && typeof repoError === 'object' && 'message' in repoError
						? (repoError as { message: string }).message
						: String(repoError)
				)

				// Continue processing other repositories instead of failing completely
				continue
			}
		}

		console.log(
			`Successfully processed ${processedRepos}/${totalRepos} repositories`
		)
		console.log(`Total commits found: ${totalCommits}`)

		return NextResponse.json({
			success: true,
			username: username,
			totalCommits: totalCommits,
			totalRepos: totalRepos,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		console.error('Cron job failed:', error)
		return NextResponse.json({ error: 'Job failed' }, { status: 500 })
	}
}

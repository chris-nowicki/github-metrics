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

    // Fetch all repositories with pagination
    const allRepos = []
    let page = 1
    let hasMorePages = true

    while (hasMorePages) {
      const repos = await octokit.request('GET /user/repos', {
        per_page: 100,
        page: page,
        affiliation: 'owner',
      })

      allRepos.push(...repos.data)
      hasMorePages = repos.data.length === 100
      page++

      if (hasMorePages) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Process repositories and count commits
    let totalCommits = 0
    let processedRepos = 0
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    for (const repo of allRepos) {
      try {
        await delay(100)

        const contributors = await octokit.request(
          'GET /repos/{owner}/{repo}/contributors',
          {
            owner: repo.owner.login,
            repo: repo.name,
          }
        )

        const ourContribution = contributors.data.find(
          contributor => contributor.login === username
        )
        
        if (ourContribution) {
          totalCommits += ourContribution.contributions
        }

        processedRepos++
      } catch (repoError) {
        console.warn(`Failed to fetch commits for repository ${repo.name}`)
        continue
      }
    }

    // Update database
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
    return NextResponse.json({ error: 'GitHub Metrics Cron Job Failed' }, { status: 500 })
  }
}
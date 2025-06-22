import { neon } from '@neondatabase/serverless'

// Types for better type safety
export interface GitHubMetrics {
	id: number
	commits: number
	repos: number
}

// Shared database connection helper
function createDatabaseConnection() {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL environment variable is not set')
	}
	return neon(process.env.DATABASE_URL)
}

// Enhanced error handling wrapper
async function withErrorHandling<T>(
	operation: () => Promise<T>,
	errorMessage: string
): Promise<T> {
	try {
		return await operation()
	} catch (error) {
		console.error(`${errorMessage}:`, error)
		throw new Error(errorMessage)
	}
}

export async function getGitHubMetrics(): Promise<GitHubMetrics | null> {
	return withErrorHandling(async () => {
		const sql = createDatabaseConnection()
		const response = await sql`
			SELECT * FROM "github metrics"."github-metrics" 
			ORDER BY id ASC 
			LIMIT 1
		`
		return (response[0] as GitHubMetrics) || null
	}, 'Failed to fetch GitHub metrics from the database')
}

export async function updateGitHubMetrics(
	commits: number,
	repos: number
): Promise<GitHubMetrics> {
	return withErrorHandling(async () => {
		const sql = createDatabaseConnection()

		const response = await sql`
			UPDATE "github metrics"."github-metrics" SET commits = ${commits}, repos = ${repos} WHERE id = 1
		`
		return response[0] as GitHubMetrics
	}, 'Failed to update GitHub metrics in the database')
}

# How to Create a Vercel Cron Job using NextJS

## Use Case
I wanted to be able to show my total all-time GitHub commits across my repositories in the *about me* section of my portfolio.  As I started working on the code I realized that this was going to be an expensive task from a resource perspective.  I didn’t want site visitors to have to wait for the data to be fetched from github every time they went to the page.  Instead, I wanted the *about me* section to fetch the values from a database and then have a process, behind the scenes, update the database with the correct number of GitHub commits.  This is where ***Cron Jobs*** come in.

## Architecture Overview
The diagram below shows how our cron job solution works to provide fast GitHub metrics to website visitors: 
![](CleanShot%202025-06-23%20at%2012.13.58@2x.png)<!-- {"width":835} -->

This approach separates expensive data fetching (background) from user requests (real-time), ensuring your portfolio loads quickly while keeping GitHub metrics up-to-date.

## What is a Cron Job
Cron jobs are scheduled tasks that runs automatically at specified times or intervals.  The name comes from “chronos” the Greek word for time.  The cron schedule uses a specific syntax with five fields representing minute, hour, day of month, month, and day of week.  For example:

- `0 2 * * *` means “run at 2:00 AM every day”
- `*/15 * * * *` means “run every 15 minutes”
- `0 0 1 * *` means “run at midnight on the first day of every month”

See [cron expressions](https://vercel.com/docs/cron-jobs#cron-expressions) in vercel’s documentation for more information.

~Some common use cases of cron jobs are:~
* Running backups at 2AM every night
* Cleaning up temporary files weekly
* Sending automated reports monthly
* Monitoring system resources every 5 minutes

## Assumptions
* You are familiar with NextJS/React Frameworks
* You are familiar with Vercel and getting your project linked using their CLI or GitHub Repository.

## Limitations
Vercel has the following [limitations](https://vercel.com/docs/cron-jobs/usage-and-pricing) based on your plan:
![](nrlunhl603b8l4zthrt9.png.webp)

## Instructions
### 1. Create an API Route
* Create a folder in the `/app/api` folder with the name of the cron job you want to run.
  * example: `/app/api/github-metrics-sync`
* Create a file called `route.ts`
* Use the following code block for the start of your cron job api route

```tsx
import { NextResponse } from 'next/server'

export async function GET() {
 try {
    // Your GitHub metrics sync logic here

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('GitHub Metrics Cron Job failed:', error)
    return NextResponse.json({ error: 'GitHub Metrics Cron Job Failed' }, { status: 500 })
  }
}
```

### 2. Secure the Cron Job
We do not want anyone to be able to access this route and execute the code.  Luckily, Vercel has a built in environment variable called `CRON_SECRET`.

- Create a secret Key
  - In your terminal or CLI type the following `openssl rand -hex 32`
  - You should have an output of something like this:
    ![](CleanShot%202025-06-22%20at%2016.26.28@2x.png)<!-- {"width":443} -->
  
- Add the `CRON_SECRET` variable to your local `.env` file with the value that is displayed in your terminal or CLI from the step above.
- Modify the code in the cron job to look for the bearer token, which is the secret key created above, and return a 401 if unauthorized (not found).  Your code should now look like the code block below.

```tsx
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from your cron service
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Your GitHub metrics sync logic here

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: 'Job failed' }, { status: 500 })
  }
}
```

- Test to make sure it worked by going to the route in your browser. You should receive a json error message, "Unauthorized”.
  ![](thxpjvdwjppblntq3utd.png.webp)

- Add the `CRON_SECRET` variable to the vercel project settings Environment Variables as seen below:![](dfskauigrlrptiqqitue.png.webp)

- Add the cron route and Schedule to your vercel.json file

> If the vercel.json file doesn’t already exist in the root of your project folder, you can manually add it.
> Add the “crons” config to the `vercel.json` file as seen below

```ts
{
    "crons": [
        {
            "path": "/api/github-metrics-sync",
            "schedule": "*/30 * * * *"
        }
    ]
}
```

> *path* is the location of the folder we created in step #1
> *schedule* is telling vercel how often the cron job should run. */30 * * * * is running the cronjob about every 30 minutes. You can play around with different schedules using [crontab guru](https://crontab.guru/#*/10_*_*_*_*).

- Once that is complete deploy your project to vercel and you can check the status of your cron job by going to the settings > crons menu for your project. You should see something like this:
![](CleanShot%202025-06-22%20at%2016.19.57@2x.png)

- Test on your live site. You should receive a json error message "Unauthorized":![](CleanShot%202025-06-22%20at%2016.24.01@2x.png)<!-- {"width":536} -->

### 3. Fetch Metrics from GitHub
Now that we have the Cron Job setup, let’s add the code to fetch GitHub metrics.  This section will walk through each step of the process, from authentication to data collection

#### Setup Database Connection
First, ensure you have a database connected to store your metrics.  We’ll need functions to update the stored values.

> **Note:** This tutorial doesn’t cover database setup in detail.  For a Neon PostgreSQL setup guide, checkout this video tutorial.

Create queries to get and update your metrics.  Your database should store:
- Total commit count
- Total repository count
- Last updated timestamp
  
#### Setup GitHub Token
We need a Fine-grained Personal Access Token to access the GitHub API:

1. Login to GitHub -> *Settings* -> *Developer settings* -> *Personal access tokens* -> *Fine-grained tokens*
2. Click **Generate new token**
3. Configure the token:
   - **Token name:** `github metrics sync`
   - **Expiration:** No expiration
   - **Repository Access:** All repositories (inclued private repos)
   - **Repository Permissions** (Read-only access)
     - Commit status
     - Contents
     - Metadata (mandatory, set automatically)
     - Pull requests
4. Generate and copy the token (**you’ll only see it once!**)
5. Add to your `.env` file:
   ```bash
   GITHUB_TOKEN=your_token_here
   ```
  
#### Install packages
Install the Octokit library for GitHub API Integration:

```bash
pnpm add @octokit/rest
```

#### Implementation Walkthrough
Now let’s build the GitHub metrics fetching functionality step by step

##### Step 1: Initialize Octokit and Setup Variables
```tsx
import { Octokit } from '@octokit/rest'

// Initialize Octokit with authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

// Get authenticated user info to avoid hardcoding username
const { data: authenticatedUser } = await octokit.request('GET /user')
const username = authenticatedUser.login
console.log(`Fetching commits for user: ${username}`)
```

##### Step 2: Fetch All User Repositiories with Pagination
GitHub’s API returns results in pages, so we need to handle pagination to get all repositories

```tsx
console.log('Fetching user repositories...')

const allRepos = []
let page = 1
let hasMorePages = true

while (hasMorePages) {
  const repos = await octokit.request('GET /user/repos', {
    per_page: 100, // Maximum allowed per page
    page: page,
    affiliation: 'owner', // Only repos we own, not collaborations
  })

  console.log(`Fetched page ${page}: ${repos.data.length} repositories`)
  allRepos.push(...repos.data)

  // Check if we need to fetch more pages
  hasMorePages = repos.data.length === 100
  page++

  // Be respectful to GitHub's API
  if (hasMorePages) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

const totalRepos = allRepos.length
console.log(`Found ${totalRepos} repositories across ${page - 1} pages`)
```

##### Step 3: Setup Rate Limiting and Commit Counting
GitHub allows 5,000 API requests per hour, so we’ll add delays to stay well within limits:

```tsx
let totalCommits = 0
let processedRepos = 0

// Helper function for rate limiting
// 100ms delay gives us plenty of headroom under the 5,000/hour limit
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
```

##### Step 4: Process Each Repository for Commit Counts
Loop through repositories and count contributions from the authenticated user:

```tsx
for (const repo of allRepos) {
  try {
    // Rate limiting delay
    await delay(100)
    
    console.log(`Processing repository: ${repo.name}`)

    // Fetch contributors for this repository
    const contributors = await octokit.request(
      'GET /repos/{owner}/{repo}/contributors',
      {
        owner: repo.owner.login,
        repo: repo.name,
      }
    )

    // Find our contributions in the contributors list
    if (contributors.data.length > 0) {
      const ourContribution = contributors.data.find(
        contributor => contributor.login === username
      )
      
      if (ourContribution) {
        totalCommits += ourContribution.contributions
        console.log(`Added ${ourContribution.contributions} commits from ${repo.name}`)
      }
    }

    processedRepos++
  } catch (repoError) {
    // Handle individual repository errors gracefully
    console.warn(`Failed to fetch commits for repository ${repo.name}:`, 
      repoError instanceof Error ? repoError.message : String(repoError)
    )
    // Continue processing other repositories
    continue
  }
}
```

##### Step 5: Update Database and Return Results
Finally, save the metrics and return a summary

```tsx
console.log(`Successfully processed ${processedRepos}/${totalRepos} repositories`)
console.log(`Total commits found: ${totalCommits}`)

// Update database with collected metrics
console.log('Updating database with new metrics...')
await updateGitHubMetrics(totalCommits, totalRepos)

return NextResponse.json({
  success: true,
  username: username,
  totalCommits: totalCommits,
  totalRepos: totalRepos,
  timestamp: new Date().toISOString(),
})
```

##### Complete Route Code
Here’s the complete `/app/api/github-metrics-sync/route.ts` file:

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

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
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
          contributor => contributor.login === username
        )
        
        if (ourContribution) {
          totalCommits += ourContribution.contributions
          console.log(`Added ${ourContribution.contributions} commits from ${repo.name}`)
        }

        processedRepos++
      } catch (repoError) {
        console.warn(`Failed to fetch commits for repository ${repo.name}:`, 
          repoError instanceof Error ? repoError.message : String(repoError)
        )
        continue
      }
    }

    console.log(`Successfully processed ${processedRepos}/${totalRepos} repositories`)
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
    return NextResponse.json({ error: 'GitHub Metrics Cron Job Failed' }, { status: 500 })
  }
}
```

### 4. Update Vercel ENV, Deploy, and Check Logs
Once everything is working locally in your development environment you will need to add the env variables to your vercel project and deploy

- Check Logs about 30min after deployment in Vercel.  You can easily access the logs from the *Cron Jobs* menu in your vercel project settings
![](CleanShot%202025-06-22%20at%2017.07.45@2x.png)

- You can then filter by warning, error, success and should see something like this where it shows you when the cron job eas executed and the status of the request
![](CleanShot%202025-06-22%20at%2017.08.55@2x.png)

## CONCLUSION
I hope this was helpful! I found this to be a nice solution for the server to take on the expensive task so those visiting my site don't have to *wait* for the fetch/parsing from the GitHub API for the metrics to load.

- Code: https://github.com/chris-nowicki/github-metrics
- Live Site: https://gh-metrics.chrisnowicki.dev/
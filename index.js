import { Octokit } from 'octokit'
import cb from 'clipboardy'
import dotenv from  'dotenv'
import util from 'util'

dotenv.config()
util.inspect.defaultOptions.depth = null

const apiKey = process.env.GITHUB_API_KEY
const octokit = new Octokit({ auth: apiKey })

// The org that the contains the events you want to include
const org = 'github'

async function main() {
  if (!apiKey) {
    console.log("Please set the GITHUB_API_KEY environment variable")
  } else {
    const {
      data: { login },
    } = await octokit.rest.users.getAuthenticated()

    const result = await octokit.request('GET /users/{username}/events', {
      username: login,
      per_page: 100, 
    })

    const today = new Date().toLocaleString( 'sv', { timeZoneName: 'short' } ).substring(0, 10)

    const data = result.data.filter(event => {
      return event.repo.name.includes(org) && event.created_at.includes(today)
    })

    const list = data.reduce((acc, curr) => {
      const item = formatEvent(curr)
      if (item && !acc.includes(item)) {
        acc += `${item}\n`
      }
      return acc
    }, '')

    cb.writeSync(list)
    console.log(list)
  }
}

function formatEvent(event) {
  const {type, payload} = event

  switch (type) {
    case 'IssuesEvent':
      if (payload.action === 'opened') {
        return `:issue-new: Opened "${payload.issue.title}" ${payload.issue.html_url}`
      }
    case 'PullRequestReviewEvent':
      if (payload.action === 'created') {
        return `:mag: Reviewed "${payload.pull_request.title}" ${payload.pull_request.html_url}`
      }
    case 'PullRequestEvent':
      if (payload.action === 'opened') {
        return `Opened "${payload.pull_request.title}" ${payload.pull_request.html_url}`
      }
    case 'PullRequestEvent':
      if (payload.action === 'review_requested') {
        return `Put up for review "${payload.pull_request.title}" ${payload.pull_request.html_url}`
      }
  }
}

main()
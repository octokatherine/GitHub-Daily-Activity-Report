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

const today = new Date().toLocaleString( 'sv', { timeZoneName: 'short' } ).substring(0, 10)
let userLogin = ''

async function main() {
  if (!apiKey) {
    console.log("Please set the GITHUB_API_KEY environment variable")
  } else {
    const {
      data: { login },
    } = await octokit.rest.users.getAuthenticated()
    userLogin = login

    let page = 1
    let data = await getListItems(page)

    // GH rate limits after 4 pages, but it's probably always enough to cover the current day
    while (page < 4) {
      const nextData = await getListItems(page)
      data = [...data, ...nextData]
      page++
    }

    const list = data.reduce((acc, curr) => {
      const item = formatEvent(curr)
      if (item && !acc.includes(item)) {
        acc += `${item}\n`
      }
      return acc
    }, '')

    cb.writeSync(list)

    console.log("Here is your GitHub activity for the day: \n")
    console.log(list)
    console.log("Copied to clipboard!")
  }
}

async function getListItems(page) {
  const result = await octokit.request('GET /users/{username}/events', {
    username: userLogin,
    per_page: 100, 
    page: page
  })

  const data = result.data.filter(event => {
    return event.repo.name.includes(org )&& event.created_at.includes(today)
  })

  return data
}

function formatEvent(event) {
  const {type, payload} = event

  switch (type) {
    case 'IssuesEvent':
      if (payload.action === 'opened') {
        return `:issue-new: Opened - ${payload.issue.title}: ${payload.issue.html_url}`
      }
    case 'PullRequestReviewEvent':
      if (payload.action === 'created') {
        return `:mag: Reviewed - ${payload.pull_request.title}: ${payload.pull_request.html_url}`
      }
    case 'PullRequestEvent':
      if (payload.action === 'opened') {
        return `:pr-open: Opened - ${payload.pull_request.title}: ${payload.pull_request.html_url}`
      } else if (payload.action === 'review_requested') {
        return `:ready-for-review: Put up for review - ${payload.pull_request.title}: ${payload.pull_request.html_url}`
      } else if (payload.action === 'closed' && payload.pull_request && payload.pull_request.merged) {
        return `:pr-merged: Merged - ${payload.pull_request.title}: ${payload.pull_request.html_url}`
      } else if (payload.action === 'closed' && payload.pull_request && !payload.pull_request.merged) {
        return `:pr-closed: Closed - ${payload.pull_request.title}: ${payload.pull_request.html_url}`
      }
  }
}

main()
# jira-github

Move your JIRA cards automatically with your PRs

-------

### 1) create a JIRA API token for your username

https://id.atlassian.com/manage-profile/security/api-tokens


### 2) create secrets with your environment variables  inside your repository

github > settings > secrets

`JIRA_API` - eg: 'https://demo.atlassian.net/rest/api/latest/issue'

`JIRA_USER`

`JIRA_PASSWORD`


### 3) copy the files

`.github/workflows/jira-integration.yml`
`jira-integration.js`

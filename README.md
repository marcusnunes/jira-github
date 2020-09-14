# jira-github

## 1) criar API token do Jira para seu usuário

https://id.atlassian.com/manage-profile/security/api-tokens

## 2) criar váriaveis de ambiente com login/senha do JIRA nos secrets do repositório

Ex: https://github.com/ztech-company/donus-rn/settings/secrets

### `JIRA_USER`
### `JIRA_PASSWORD`

## 3) copiar arquivos

### `.github/workflows/jira-integration.yml`
### `jira-integration.js`

Axios pode ser substituido pelo Node HTTP para não ter dependências. Caso seu script utilize o axios, copie também o `package.json`.

https://nodejs.org/api/http.html

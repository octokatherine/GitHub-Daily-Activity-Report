# Daily Activity Report 

### Usage 

1. Create a GitHub personal access token 

https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

2. Add the token to a .env file in the root directory of the project  
```
GITHUB_API_KEY=<your token>
```

3. Install dependencies
```
npm install
```

4. Run the following command to generate your report. It will be automatically copied to your clipboard.
  
```
npm run report
```


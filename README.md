# check_le_count
Check the number of renewals and issuances on LetsEncrypt for a domain

# Install

```npm install -g```

```check_le_count %.example.com```

Returns a list of certificates issued for subdomains of example.com in the previous 7 days using crt.sh database access.
For each domain it checks if it is a renewal or a new issuance counting towards the 20 certificate limit.

```check_le_count %.example.com 14```

The optional second argument changes the number of days to check.

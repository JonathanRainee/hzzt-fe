Work through plan/plan.md from phase f0 to f10, starting from phase f0 all the way to f10.

For each phase:
0. make a new branch with the format [feat]/[phase name]
1. Implement it fully.
2. Run the tests (and add tests for what you built). Make sure the app starts.
3. Only if everything passes: tick off the phase in PLAN.md and commit
   with a message like "[feat]: [branch name]". -m "[phase-t] [what you add]"

   if all sub phase alr done for a phase push it  and make a pr to development branch
4. Then move on to the next phase.

Stop and ask me if:
- tests keep failing after a few honest attempts
- you need a secret, API key, or a decision only I can make

here's the api key and url for

-crypto
--url: https://pro-api.coinmarketcap.com/v2/simple/price?symbol=BTC,WALLET
--header used: X-CMC_PRO_API_KEY 
--api key: 5616f93a17444654860e385e8b1d9cd7

-us stocks (the api key used in url no header)
--url: https://api.massive.com/v3/reference/tickers/AAPL?apiKey=IsPnXSqMi_xSw_KU3NYIcu8UK2qr0GTj

us stock
https://api.massive.com/v3/reference/tickers/AAPL?apiKey=IsPnXSqMi_xSw_KU3NYIcu8UK2qr0GTj
apikey IsPnXSqMi_xSw_KU3NYIcu8UK2qr0GTj

exchange rate
--url: https://api.freecurrencyapi.com/v1/latest?base_currency=USD&currencies=EUR,JPY,GBP,IDR
--header used: apikey 
--api key: fca_live_O0G7SzSK5ewOWah3vKTjbraYeRwiZmN3yXT0WpaF

store all api key in env

Never commit .env or secrets. Don't skip phases or rewrite the plan silently.
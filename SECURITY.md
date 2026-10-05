# Security

Pawelle is a **local-first** app. It stores a pet's details and photos on your own computer and runs its AI model locally, so most of the usual web risks (accounts, cloud storage, third-party APIs) simply don't exist here. What is left is protected like this:

- **Only this computer can reach it.** The API listens on `127.0.0.1`, and it also rejects any request whose `Host` or `Origin` isn't this computer. That blocks cross-site requests and DNS-rebinding attacks from web pages you might have open.
- **No outbound traffic.** The app makes no external requests: no analytics, CDNs, fonts or hosted APIs. The model runs through [Ollama](https://ollama.com) on `localhost`, and `OLLAMA_URL` is refused if it points anywhere else.
- **Your data stays private on disk.** The SQLite database and its backups are created readable only by your user.
- **The AI has no tools and no network.** It can't browse, run code or read files. Its input is limited to structured profile and check-in data (never free-text notes or photos). Its output is checked by code before it is shown, and a red-flag check runs *before* the model.
- **Uploads are inspected.** Photos are checked by their real file signature (JPEG, PNG or WebP only), limited to 1 MB and never executed or rendered as HTML.
- **Queries are parameterised** and responses carry restrictive security headers.

## Reporting a problem

If you find a security issue, please **don't open a public issue**. Use GitHub's private reporting: open the repository's *Security* tab and choose *Report a vulnerability*. I'll respond as soon as I can.

## Keeping your own copy safe

- Don't expose the server beyond your machine (for example by changing the bind address or putting it behind a tunnel). Pawelle has no accounts or login by design.
- Keep the `pawelle-app/data/` folder out of version control and out of shared backups unless you want your pet's data there. It is git-ignored by default.
- Pawelle gives general wellbeing suggestions and is not a vet.

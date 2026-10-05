# ks-auto-redeemer

Kingshot Gift code auto-redeemer. This tool automates the process of redeeming gift codes for all members of specified alliances in a kingdom.

## Features

- **Auto-fetching**: Automatically fetches the latest gift codes from `kingshot.net`.
- **Alliance-wide**: Redeems codes for every player in the specified alliances.
- **Rate Limit Handling**: Includes basic sleep logic and retries to handle "Too many redemption attempts".
- **Test Mode**: Support for testing using a local alliance roster JSON file.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/carrarm/ks-auto-redeemer.git
   cd ks-auto-redeemer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the tool using `node`:

```bash
node ks-redeemer.js --kid=<kingdom_id> --alliances=<tag1,tag2> [options]
```

### Examples

- **Redeem current codes for a single alliance:**
  ```bash
  node ks-redeemer.js --kid=10 --alliances=ABC
  ```

- **Redeem specific codes for multiple alliances:**
  ```bash
  node ks-redeemer.js --kid=10 --alliances=ABC,XYZ --codes=CODE1,CODE2
  ```

- **Check available codes without redeeming:**
  ```bash
  node ks-redeemer.js --check-codes
  ```

### Command-line Options

| Option | Description |
| --- | --- |
| `--alliances` | **Required.** Comma-separated alliance tags (e.g., `ABC,XYZ`). |
| `--kid` | **Required.** Kingdom ID. |
| `--codes` | Optional. Comma-separated gift codes. If omitted, it fetches them from `kingshot.net`. |
| `--ignored-codes` | Optional. Comma-separated codes to skip (useful for long-term codes already claimed). |
| `--check-codes` | Optional. Only fetches and displays available codes without performing redemption. |
| `--test` | Optional. Run in test mode using `ks-alliance-roster.json` instead of fetching members from the API. |
| `--help` | Show the help message. |

## License

ISC

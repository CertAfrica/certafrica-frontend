
  # CertAfrica Frontend

  React + Vite frontend for the CertAfrica project.

  ## Prerequisites

  - Node.js v18 or later
  - npm (or yarn / pnpm)

  ## Setup

  1. Install dependencies

  ```bash
  npm install
  ```

  2. Start the development server (Vite)

  ```bash
  npm run dev
  ```

  By default the dev server runs on `http://localhost:5173`.

  ## Build & Preview

  Build the production bundle:

  ```bash
  npm run build
  ```

  Preview the production build locally:

  ```bash
  npm run preview
  ```

  ## Environment

  You can configure the API base URL with an environment variable (used by the app as `import.meta.env.VITE_API_URL`). Example:

  ```
  VITE_API_URL=http://localhost:4000/api
  ```

  Create a `.env` file in the project root to override defaults for local development.

  ## Lint & Format

  If available in `package.json`, run:

  ```bash
  npm run lint
  npm run format
  ```

  ## Notes

  - This repository is the frontend companion to the backend service in `certafrica-backend` and the ML service in `certafrica-ml`.
  - For end-to-end development, start the backend and worker processes per their README files so the frontend can reach the API.

  If you want any additional setup steps (storybook, tests, or CI badges), tell me what you'd like added and I'll update this file.
  
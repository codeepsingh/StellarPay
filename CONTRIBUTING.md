# Contributing to StellarPay

We welcome contributions to StellarPay! As a Web3 project built on Stellar and Soroban, maintaining security, performance, and clean architecture is essential.

Please review the following guidelines to ensure a smooth contribution process.

---

## Code of Conduct

By participating in this project, you agree to treat all contributors with respect, maintain a professional tone, and report any inappropriate behavior to the repository maintainers.

---

## How to Contribute

### 1. Reporting Bugs
*   Search the open issues to check if the bug has already been reported.
*   If not, open a new issue detailing:
    *   Steps to reproduce the problem.
    *   Expected vs. actual behavior.
    *   Your operating system, browser, and connected wallet extension (Freighter, etc.).
    *   Console error logs or transaction hashes if applicable.

### 2. Proposing Features
*   Open an issue with the tag `enhancement`.
*   Explain the user story, design considerations, and why the feature would benefit StellarPay users.

### 3. Submitting Pull Requests
*   Fork the repository and create a new feature branch from `main`:
    ```bash
    git checkout -b feature/your-feature-name
    ```
*   Implement changes ensuring you write matching unit or integration tests.
*   Format your code and verify that lint rules pass:
    ```bash
    npm run lint
    ```
*   Verify that all automated tests pass:
    ```bash
    node --test tests/stellar.test.js
    cd contracts && cargo test
    ```
*   Submit a pull request (PR) targeting the `main` branch. 
*   Ensure your PR description clearly states the issues solved, screenshots of UI changes, and testing details.

---

## Coding Standards

### Frontend (React/Vite)
*   **Aesthetics**: Follow the modern styling guideline—rounded elements (`rounded-2xl`, `rounded-3xl`), glassmorphism cards (`glass-card`), elegant shadows, transitions on hover, and strict dark mode styling.
*   **ESM Imports**: Always specify explicit file extensions (e.g. `import foo from './foo.js'`) to support native ESM resolution.
*   **State Management**: Rely on React state, local storage cache, and native browser queries. Avoid adding server-side state or REST API dependencies.

### Blockchain (Soroban Rust Contracts)
*   Ensure all smart contract functions have authorization checks: `user.require_auth()`.
*   Avoid large memory footprint allocations.
*   Implement matching unit tests inside the `#[cfg(test)]` module for every added contract method.
*   Format using Rust standard styling:
    ```bash
    cargo fmt
    ```

---

## Commit Guidelines

Follow consistent naming in your commits:
*   `feat: ...` for new features.
*   `fix: ...` for bug fixes.
*   `docs: ...` for documentation updates.
*   `chore: ...` for dependencies or housekeeping tasks.

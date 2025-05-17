# Contributing to WorkMatrix

First off, thank you for considering contributing to WorkMatrix! It's people like you that make WorkMatrix such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots and animated GIFs if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the JavaScript/TypeScript and Python styleguides
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
    * 🎨 `:art:` when improving the format/structure of the code
    * 🐎 `:racehorse:` when improving performance
    * 🚱 `:non-potable_water:` when plugging memory leaks
    * 📝 `:memo:` when writing docs
    * 🐛 `:bug:` when fixing a bug
    * 🔥 `:fire:` when removing code or files
    * 💚 `:green_heart:` when fixing the CI build
    * ✅ `:white_check_mark:` when adding tests
    * 🔒 `:lock:` when dealing with security
    * ⬆️ `:arrow_up:` when upgrading dependencies
    * ⬇️ `:arrow_down:` when downgrading dependencies

### JavaScript/TypeScript Styleguide

* Use TypeScript for all new code
* Use 2 spaces for indentation
* Use semicolons
* Use single quotes
* Follow the ESLint configuration
* Use meaningful variable names
* Document complex code sections

Example:
```typescript
// Good
interface UserProps {
  name: string;
  email: string;
}

function formatUser({ name, email }: UserProps): string {
  return `${name} <${email}>`;
}

// Bad
function format(u: any): string {
  return u.n + ' <' + u.e + '>';
}
```

### Python Styleguide

* Follow PEP 8
* Use 4 spaces for indentation
* Use type hints for all new code
* Document functions and classes with docstrings
* Use meaningful variable names
* Keep functions focused and small

Example:
```python
from typing import List, Optional

class DataCollector:
    """Collects and processes system data.
    
    Attributes:
        interval: Collection interval in seconds
        max_items: Maximum number of items to collect
    """
    
    def __init__(self, interval: int = 60, max_items: Optional[int] = None) -> None:
        self.interval = interval
        self.max_items = max_items
        
    def collect_data(self) -> List[dict]:
        """Collects system data.
        
        Returns:
            List of collected data points
        """
        # Implementation
        pass
```

### Documentation Styleguide

* Use Markdown for documentation
* Reference code with backticks
* Include code examples when relevant
* Keep documentation up to date with code changes
* Use headers to organize content
* Include links to related documentation

## Setting Up Development Environment

1. Fork and clone the repository
2. Set up Front-End:
   ```bash
   cd Front-End
   pnpm install
   cp .env.example .env.local
   # Configure .env.local
   pnpm dev
   ```

3. Set up Background-App:
   ```bash
   cd Background-App
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   cp config.example.py config.py
   # Configure config.py
   python src/main.py
   ```

## Community

* Join our [Discord server](https://discord.gg/workmatrix)
* Follow us on [Twitter](https://twitter.com/workmatrix)
* Read our [blog](https://blog.workmatrix.com)

## Questions?

Feel free to contact the project maintainers if you have any questions. 
# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of WorkMatrix seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

Please **DO NOT** report security vulnerabilities through public GitHub issues.

Instead, please report them via email to [security@workmatrix.com](mailto:security@workmatrix.com).

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

After you have submitted your report, you can expect:

1. Confirmation of receipt within 48 hours
2. Initial assessment and expected timeline for resolution within 1 week
3. Regular updates about the progress
4. Credit for the discovery (if desired)

## Security Best Practices

### For Users

1. **Authentication**
   - Use strong passwords
   - Enable two-factor authentication when available
   - Never share your credentials

2. **Data Protection**
   - Regularly review captured data
   - Set appropriate retention periods
   - Use privacy mode when needed

3. **System Security**
   - Keep your system updated
   - Use antivirus software
   - Enable system firewall

### For Developers

1. **Code Security**
   - Follow secure coding guidelines
   - Review dependencies regularly
   - Use static code analysis tools

2. **Data Handling**
   - Encrypt sensitive data
   - Implement proper access controls
   - Follow data protection regulations

3. **API Security**
   - Use HTTPS everywhere
   - Implement rate limiting
   - Validate all inputs

## Security Features

### Data Encryption

- All sensitive data is encrypted at rest
- End-to-end encryption for data transmission
- Secure key management

### Access Control

- Role-based access control (RBAC)
- Fine-grained permissions
- Session management

### Monitoring

- Security event logging
- Automated threat detection
- Regular security audits

## Vulnerability Disclosure Timeline

1. **Report Reception**: Acknowledge receipt within 48 hours
2. **Assessment**: Complete initial assessment within 1 week
3. **Resolution**: Develop and test fix within agreed timeline
4. **Disclosure**: Coordinate public disclosure after fix deployment

## Bug Bounty Program

We currently do not have a bug bounty program, but we greatly appreciate the efforts of security researchers who help keep WorkMatrix secure.

## Security Updates

Security updates will be released through:

1. GitHub Security Advisories
2. Email notifications to registered users
3. Release notes in our documentation

## Contact

For any security-related questions, please contact:
- Email: [security@workmatrix.com](mailto:security@workmatrix.com)
- PGP Key: [security-pgp.asc](https://workmatrix.com/security-pgp.asc) 
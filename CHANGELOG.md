# Change Log

All notable changes to the "json2type" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
- No unreleased changes.

## v1.1.3

### Fixed
- Robust sanitization: remove `//` and `/*...*/` comments only outside strings, preserving URLs like `http://...`.
- Trailing comma tolerance before `}`/`]` and at end‑of‑input.
- Improved error messages on invalid JSON syntax.

## v1.0.0 Full release
-
## v0.0.1 Initial Release

- Initial release

- Lowered the minimal version of VS Code this is available in order to allow for installations on diferent branches of VS code (cursor, windsurf)

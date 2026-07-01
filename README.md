# dotfiles

Personal configuration files for my development environment.

## Structure

This repo mirrors parts of my home directory. Files and directories are stored here using the same relative paths they would have under `~`, then symlinked back into their expected locations.

For example, a file stored at:

```text
.pi/agent/settings.json
```

can be symlinked to:

```text
~/.pi/agent/settings.json
```

This keeps configuration tracked in the dotfiles repo while tools continue to read and write the paths they normally expect.

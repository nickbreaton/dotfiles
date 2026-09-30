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

This keeps configuration tracked in the dotfiles repo while tools continue to read and write the paths they normally expect. Repository-only helpers live in `repo/` and are not meant to be symlinked into `~`.

## Git filters

Configure the settings filters once after cloning:

```sh
git config --local filter.pi-settings.clean 'jq "del(.lastChangelogVersion, .defaultProvider, .defaultModel, .defaultThinkingLevel)"'
git config --local filter.pi-settings.smudge cat
git config --local filter.pi-settings.required true

git config --local filter.zed-settings.clean './repo/git-filters/zed-settings-clean'
git config --local filter.zed-settings.smudge cat
git config --local filter.zed-settings.required true
```

These keep Pi's machine-local changelog, provider, model, and thinking defaults, along with Zed's `theme.mode` and `icon_theme.mode`, in the working files but remove them from commits.

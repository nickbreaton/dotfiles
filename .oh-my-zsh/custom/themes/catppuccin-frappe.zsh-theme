# Catppuccin Frappé for Oh My Zsh
# Palette: https://catppuccin.com/palette/

local frappe_red="#e78284"
local frappe_yellow="#e5c890"
local frappe_green="#a6d189"
local frappe_teal="#81c8be"
local frappe_blue="#8caaee"
local frappe_mauve="#ca9ee6"

PROMPT="%(?:%F{$frappe_green}➜:%F{$frappe_red}➜)%f %F{$frappe_blue}%1~%f \$(git_prompt_info)"

ZSH_THEME_GIT_PROMPT_PREFIX="%F{$frappe_teal}git:(%F{$frappe_mauve}"
ZSH_THEME_GIT_PROMPT_SUFFIX="%F{$frappe_teal})%f "
ZSH_THEME_GIT_PROMPT_DIRTY="%F{$frappe_yellow} ✗%f"
ZSH_THEME_GIT_PROMPT_CLEAN=""

#!/usr/bin/env bash
# Installs Qoder CLI + ensures the `qoder` dispatcher is on PATH for
# non-login interactive shells (~/.profile only loads in login shells here).

curl -fsSL https://qoder.com/install | bash

# qodercli install writes its PATH/QODER_DISPATCHER_PATH block to ~/.profile,
# which non-login bash never sources. This environment's Replit bashrc sources
# $REPL_HOME/.config/bashrc for every interactive shell, so put the block there.
_rc="${REPL_HOME:-$HOME}/.config/bashrc"
_marker="# QODER_DISPATCHER_PATH"
if [ -f "$_rc" ] && grep -q "$_marker" "$_rc" 2>/dev/null; then
  :
else
  mkdir -p "$(dirname "$_rc")"
  {
    echo ""
    echo "# QODER_DISPATCHER_PATH"
    echo "PATH=\"$HOME/.qoder/entry:\$PATH\""
    echo "export PATH"
    echo "# END QODER_DISPATCHER_PATH"
  } >> "$_rc"
fi
unset _rc _marker

#!/usr/bin/env bash
# PostToolUse hook: format + lint the single file Claude just edited.
#
# Formatters (pint, oxfmt) and Rector are idempotent — run them always, silently.
# For JS/TS/Vue, oxlint --fix auto-corrects what it can; any remaining
# (unfixable) errors are sent back to Claude via exit code 2 so it can
# self-correct in the same turn. Slow/whole-project checks (phpstan,
# vue-tsc, tests) deliberately stay in the git hooks, not here.
set -uo pipefail

# The edited file path arrives as JSON on stdin.
file_path="$(jq -r '.tool_input.file_path // empty')"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

OXFMT="node_modules/.bin/oxfmt"
OXLINT="node_modules/.bin/oxlint"
PINT="vendor/bin/pint"
RECTOR="vendor/bin/rector"

case "${file_path##*.}" in
    php)
        # Rector rewrites, then Pint formats — same order as the frontend chain.
        # PHP static analysis (phpstan) stays a pre-push concern.
        case "${file_path#"$PWD"/}" in
            # Rector reads Blade as plain PHP and would mangle it.
            *.blade.php) ;;
            app/* | bootstrap/* | config/* | database/* | routes/* | tests/*)
                [ -x "$RECTOR" ] && "$RECTOR" process "$file_path" --no-diffs >/dev/null 2>&1
                ;;
        esac
        [ -x "$PINT" ] && "$PINT" "$file_path" >/dev/null 2>&1
        ;;
    js | ts | jsx | tsx | vue | mjs | cjs)
        # Auto-fix lint first, then format last (mirrors the git-hook order).
        lint_output=""
        lint_rc=0
        if [ -x "$OXLINT" ]; then
            lint_output="$("$OXLINT" --fix "$file_path" 2>&1)"
            lint_rc=$?
        fi
        [ -x "$OXFMT" ] && "$OXFMT" "$file_path" >/dev/null 2>&1
        if [ "$lint_rc" -ne 0 ]; then
            echo "oxlint reported unfixable issues in $file_path:" >&2
            echo "$lint_output" >&2
            exit 2
        fi
        ;;
    css | scss | json | jsonc | yaml | yml | md)
        # Formatting only; oxlint does not lint these.
        [ -x "$OXFMT" ] && "$OXFMT" "$file_path" >/dev/null 2>&1
        ;;
    *)
        exit 0
        ;;
esac

exit 0

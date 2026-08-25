#!/usr/bin/env bash
# Run Pest with test impact analysis: only the tests your change can affect are
# re-run, the rest are replayed from a recorded graph of which test touches
# which file.
#
# TIA needs a coverage driver to record that graph. Nothing is installed and
# nothing is switched on for good — Herd already ships Xdebug builds it does not
# load, and this borrows the matching one for the length of one run, so the
# websites Herd serves stay fast.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

PEST="vendor/bin/pest"

# Already have a driver (CI, or a PHP built with pcov) — nothing to arrange.
if php -r 'exit(extension_loaded("pcov") || extension_loaded("xdebug") ? 0 : 1);' 2>/dev/null; then
    exec "$PEST" --tia "$@"
fi

version="$(php -r 'echo PHP_MAJOR_VERSION, PHP_MINOR_VERSION;' 2>/dev/null)"
arch="$(uname -m)"
[ "$arch" = "x86_64" ] && arch="x86"
xdebug="/Applications/Herd.app/Contents/Resources/xdebug/xdebug-${version}-${arch}.so"

# No driver and no Herd: run anyway. Pest says TIA is skipped and runs the lot.
[ -f "$xdebug" ] || exec "$PEST" --tia "$@"

# Pest is called directly rather than through `artisan test`, because that runs
# Pest in a child process which these -d flags would not reach.
exec php -d zend_extension="$xdebug" -d xdebug.mode=coverage "$PEST" --tia "$@"

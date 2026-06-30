#!/bin/bash
set -e

echo "Patching vuestic-ui useTeleported compatibility..."

PATCH1="node_modules/vuestic-ui/dist/es/src/composables/useTeleported.js"
PATCH2="node_modules/vuestic-ui/dist/esm-node/src/composables/useTeleported.mjs"

if [ -f "$PATCH1" ]; then
  sed -i '' 's/\.\$vaColorConfig\.getAppStylesRootAttribute()/\$vaColorConfig == null ? void 0 : \$vaColorConfig.getAppStylesRootAttribute == null ? void 0 : \$vaColorConfig.getAppStylesRootAttribute()/' "$PATCH1"
  echo "Patched $PATCH1"
else
  echo "Skipping $PATCH1 (not found)"
fi

if [ -f "$PATCH2" ]; then
  sed -i '' 's/\.\$vaColorConfig\.getAppStylesRootAttribute()/\$vaColorConfig == null ? void 0 : \$vaColorConfig.getAppStylesRootAttribute == null ? void 0 : \$vaColorConfig.getAppStylesRootAttribute()/' "$PATCH2"
  echo "Patched $PATCH2"
else
  echo "Skipping $PATCH2 (not found)"
fi

echo "Vuestic UI patch applied."

docker run --rm -ti \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|GH_|GITHUB_') \
 -v "/$(pwd):/project" \
 -v "/$(mkdir -p ~/.cache/electron && cd ~/.cache/electron && pwd):/root/.cache/electron" \
 -v "/$(mkdir -p ~/.cache/electron-builder && cd ~/.cache/electron-builder && pwd):/root/.cache/electron-builder" \
 electronuserland/builder:latest \
 /bin/bash -c "yarn install && yarn electron-builder --linux AppImage"

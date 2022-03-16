set -e

git checkout build
git merge master -m "Merge master"
yarn build-web
git add -A docs
git commit -m "Release"
echo "Now git push origin build"

set -e
git switch build
git merge master -m "Merge master"
rm -rf docs
yarn build-web
git add -A docs
git commit -m "Release"
git switch master
echo "Now git push origin build"

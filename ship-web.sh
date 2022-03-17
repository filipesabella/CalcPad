git checkout build
git merge master -m "Merge master"
rm -rf docs
yarn build-web
mv docs/index-web.html docs/index.html
git add -A docs
git commit -m "Release"
echo "Now git push origin build"

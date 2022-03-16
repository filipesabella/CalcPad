git checkout build
git merge master -m "Merge master"
yarn build-web
mv docs/index-html.html docs/index.html
git add -A docs
git commit -m "Release"
echo "Now git push origin build"

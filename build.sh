cd Nisweet-Frontend
version=$(git describe --abbrev=0 --tags)
sed -i -e "s/\"version\": \"0.0.0\"/\"version\": \"$version\"/g" package.json
cat package.json

pnpm install
node ./scripts/i18n.mjs
pnpm build
cp -r dist ../
cd ..

cd NiSweet-Dist
rm -rf dist
cp -r ../dist .
git add .
git config --local user.email "nisweet@peifeng.li"
git config --local user.name "LEO"
git commit --allow-empty -m "upload $version dist files" -a
git tag -a $version -m "release $version"
cd ..

mkdir compress
tar -czvf compress/dist.tar.gz dist/*
zip -r compress/dist.zip dist/*

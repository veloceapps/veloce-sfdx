#!/bin/bash
cat <<EOF > README.md
[![Version](https://img.shields.io/npm/v/veloce-sfdx.svg)](https://npmjs.org/package/veloce-sfdx)
[![CircleCI](https://circleci.com/gh/veloceapps/veloce-sfdx/tree/master.svg?style=shield)](https://circleci.com/gh/veloceapps/veloce-sfdx/tree/master)
EOF
echo '' >> README.md
echo '```' >> README.md
sfdx veloce >> README.md
echo '```' >> README.md

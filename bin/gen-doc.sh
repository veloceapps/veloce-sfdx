#!/bin/bash
cat <<EOF > README.md
[![Version](https://img.shields.io/npm/v/veloce-sfdx.svg)](https://npmjs.org/package/veloce-sfdx)
![unit tests](https://github.com/veloceapps/veloce-sfdx/actions/workflows/unit-tests.yml/badge.svg)

EOF
echo '' >> README.md
echo '```' >> README.md
sfdx veloce >> README.md
echo '```' >> README.md

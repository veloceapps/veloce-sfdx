#!/bin/bash
echo '```' > README.md
sfdx veloce >> README.md
echo '```' >> README.md

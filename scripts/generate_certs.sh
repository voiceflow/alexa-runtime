#!/bin/bash

brew list mkcert

if [ $? -ne 0 ]; then
    echo "mkcert was not detected by Brew, installing now!"
    brew install mkcert
    mkcert -install
fi

rm -rf certs/
mkdir -p certs/ && cd certs/
$(brew --prefix mkcert)/bin/mkcert localhost 127.0.0.1 ::1

# Rename certificate and key
mv *-key.pem localhost.key
mv *.pem localhost.crt

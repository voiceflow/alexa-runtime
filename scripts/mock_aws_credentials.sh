#!/bin/sh

mkdir -p ~/.aws

cat > ~/.aws/credentials << EOL
[default]
aws_access_key_id=TEST
aws_secret_access_key=TEST
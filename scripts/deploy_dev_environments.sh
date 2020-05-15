#!/bin/bash

if [ -z "$1" ]
  then
    echo "ERROR: No environment supplied!"
    echo "Usage: yarn preview:new [environment name]"
    exit 1
fi

ENV_NAME=$1
CURRENT_BRANCH=$(git branch --show-current)
DEV_BRANCH_NAME="${ENV_NAME}_$(date +%s)" # Simply use the env-adjective-noun_epoch as the branch name

echo -e "Pushing your code to CD pipeline..."
{ # Suppress command outputs since it's not relevant for the end-user
  git stash save "PREDEV_STASH" # Stash changes with this name if applicable
  git branch -D $DEV_BRANCH_NAME # Force delete the ephemeral branch for safety
  git checkout -b $DEV_BRANCH_NAME
  git push --force --set-upstream origin $DEV_BRANCH_NAME --no-verify

  git checkout $CURRENT_BRANCH

  STASH_NAME=$(git stash list | head -1 | awk -F'. ' ' { print $NF }')
  if [ "$STASH_NAME" == "PREDEV_STASH" ]; then
    git stash pop # Only pop if the previous stash is made by the ephemeral environments preview
  fi
  git branch -D $DEV_BRANCH_NAME # Force delete the ephemeral branch to prevent direct user modification
} &> /dev/null  

echo -e "Your code has been pushed! Please check CircleCI for deployment details: https://app.circleci.com/pipelines/github/voiceflow/alexa?branch=$DEV_BRANCH_NAME"
#!/bin/sh -l

set -eu
. /opt/venv/bin/activate

# Check hub installation
hub version

# Requires BRANCH_NAME, GIT_EMAIL, GIT_NAME, GITHUB_USER, GITHUB_API_TOKEN, GITHUB_TOKEN to be included by workflow

DATA_TIMESTAMP=$(date "+%Y-%m-%d-%H")
CLONE_CUTOFF=$(date "+%Y-%m-%d" -d "7 days ago")

# Configure git + hub
git config --global user.email "$GIT_EMAIL"
git config --global user.name "$GIT_NAME"
git config --global hub.protocol https

# Get latest copy of repository
git clone --shallow-since=$CLONE_CUTOFF --no-single-branch https://github.com/LLNL/llnl.github.io.git
cd llnl.github.io
REPO_ROOT=$(pwd)

# Checkout data update branch, creating new if necessary
git checkout $BRANCH_NAME || git checkout -b $BRANCH_NAME
git merge --ff-only master

# Run MASTER script
cd $REPO_ROOT/_explore/scripts
./MASTER.sh

# Commit update
cd $REPO_ROOT
git config --list
git add -A .
git commit -m "$DATA_TIMESTAMP Data Update by $GITHUB_USER"

# Push update
git push --set-upstream origin $BRANCH_NAME

# Create pull request, or list existing
hub pull-request --no-edit --message "Data Update by $GITHUB_USER" || hub pr list --state open --head $BRANCH_NAME

#!/bin/bash

NODE=${NODE:-node} 

./node_modules/.bin/webdriver-manager update;

./node_modules/.bin/http-server -p $TEST_SERVER_PORT --silent &
HTTP_PID=$!

./node_modules/.bin/webdriver-manager start > /dev/null &
DRIVER_PID=$!

$NODE test/runner

TEST_RUNNER_EXIT=$?

kill $HTTP_PID

if [ $TEST_RUNNER_EXIT == "0" ]; then
    exit 0
else
    exit 1
fi;
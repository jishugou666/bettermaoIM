@echo off
echo Running Socket.IO test...
node test_socketio_final.js > test_output.txt 2>&1
type test_output.txt

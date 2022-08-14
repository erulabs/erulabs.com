#!/bin/bash

./scripts/generate_self_signed_cert.sh

NODE_ENV=development node --dns-result-order ipv4first ./https-dev-server.js

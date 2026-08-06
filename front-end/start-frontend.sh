#!/bin/bash
cd /var/www/html/nguni/front-end || exit
npx serve -s dist -l 8080

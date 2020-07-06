#!/bin/bash

./get_data.py

NOW=`date -u "+%B %d at %R UTC"`

sed -i "s/updated on .*UTC/updated on $NOW/" ../by-country.html

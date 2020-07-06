#!/bin/bash

./get_data.py

YESTERDAY=`date -d yesterday "+%B %d"`
NOW=`date "+%B %d at %R %Z"`
ZONE=`date "+%Z"`

sed -i "s/$YESTERDAY.*$ZONE/$NOW/" ../by-country.html

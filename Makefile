prognam = webtab

install: 
	mkdir -p /var/www/htdocs/$(prognam)
	cp *.html *.js /var/www/htdocs/$(prognam)


default: stagestosaturn.epub

.PHONY: clean
clean:
	git clean -fX

REVISION := $(shell git rev-parse HEAD)

# for simplicity, depend on all files known to Git
GIT_FILES := $(shell git ls-tree -r --name-only HEAD)

# extract OEBPS dependencies from content.opf
OEBPS_FILES := $(addprefix OEBPS/, $(shell grep '<item href' OEBPS/content.opf | cut -d '"' -f 2))

stagestosaturn.epub: $(GIT_FILES) $(OEBPS_FILES)
	rm -f $@
	zip -X $@ mimetype
	zip -rg $@ META-INF OEBPS -x \*~ \*.gitignore

OEBPS/about.htm: about.htm
	sed "s/REVISION/$(REVISION)/g" $< > $@

OEBPS/%.htm: %.htm
	PYTHONPATH=html5lib-python python sanitize.py $< $@

OEBPS/%.jpg: %.jpg
	./resize.sh $< $@ 768 1024

OEBPS/stylesheet.css: stylesheet.css
	cp $< $@

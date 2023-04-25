(function($) {
    'use strict';

    window.SCROLL_WEBHELP = window.SCROLL_WEBHELP || {};
    window.SCROLL_WEBHELP.search = window.SCROLL_WEBHELP.search || {};


    window.SCROLL_WEBHELP.search.performSearch = function(query, onResultsAvailableCallback) {
        var url = getSearchUrl(query);

        $('.ht-search-dropdown.ht-dropdown').append('<div style="display:none;" id="temp-search-results-container"></div>');

        var action = $('#search').attr('action');
        var tempContainer = $('#temp-search-results-container');
        tempContainer.load(action + " #quick-search-results>ul", url + "&quicksearch=true", function() {
            var results = [];

            $.each(tempContainer.find('li a'), function(index, val) {
                var item = $(this);
                results.push({
                    title: item.text(),
                    link: item.attr('href')
                });
            });

            tempContainer.remove();

            onResultsAvailableCallback(results, query);
        });
    };


    function getSearchUrl(query) {
        var url = 'q=' + encodeURIComponent(query);
        if (isScrollSearchEnabled()) {
            url += "&cql=" + encodeURIComponent(createCqlQuery(query));
        }
        url += "&max=15";
        return url;
    }


    var isScrollSearchEnabled = function() {
        return $('meta[name=scrollSearch]').attr('content') === 'true';
    }


    function createCqlQuery(query, versionName, variantName, languageKey) {
        var cql = '';
        // search for all content when no input is provided
        if (query.trim().length > 0) {
            cql = "(";
            query.split(/\s+/).forEach(function(word, index) {
                if (index > 0) {
                    cql += " OR ";
                }
                cql += "text~'" + word + "'";
            });
            cql += ") AND ";
        }

        cql = addSpaceParam(cql);
        if (isScrollSearchEnabled()) {
            // only use the custom content types to avoid duplicates in search results
            cql += " AND type=\"com.k15t.scroll.scroll-platform:scroll-search-proxy-content-type\"";
            cql = addScmContextCqlParameters(cql, versionName, variantName, languageKey);
        } else {
            cql += " AND type=\"page\"";
        }
        return cql;
    }


    function addSpaceParam(cql) {
        cql += "space='" + $('meta[name=spaceKey]').attr('content') + "'";
        return cql;
    }


    function addScmContextCqlParameters(cql, versionName, variantName, languageKey) {
        if (typeof Scroll === 'undefined' || !Scroll.Versions || !Scroll.Versions.Context) {
            // we can't add the context if we don't have it
            return cql;
        }

        if ((Scroll.Versions.Context.modules.VersionManagement.isEnabledInSpace && Scroll.Versions.Context.user.workingVersion) ||
            versionName) {
            cql += " AND scrollVersion='" + (versionName || Scroll.Versions.Context.user.workingVersion.name) + "'";
        }

        if (((Scroll.Versions.Context.modules.VariantManagement.isEnabledInSpace && Scroll.Versions.Context.user.currentVariant &&
            Scroll.Versions.Context.user.currentVariant.name !== 'all') || variantName) && variantName !== 'all') {
            // when searching for 'all' variant a variant parameter must not be provided
            cql += " AND scrollVariant='" + (variantName || Scroll.Versions.Context.user.currentVariant.name) + "'";
        }

        if ((Scroll.Versions.Context.modules.TranslationManagement.isEnabledInSpace && Scroll.Versions.Context.user.currentLanguage)
            || languageKey) {
            cql += " AND scrollLanguage='" + (languageKey || Scroll.Versions.Context.user.currentLanguage.key) + "'";
        }
        return cql;
    }


    window.SCROLL_WEBHELP.search.navigateToSearchPage = function(query) {
        var action = $('#search').attr('action');
        window.location.href = action + '?' + getSearchUrl(query) + getScmContextQueryParameters();
    };


    function getScmContextQueryParameters() {
        var scmQueries = "";
        $('select[name="scroll-translations:language-key"] > option[selected]').each(function() {
            scmQueries = scmQueries + '&' + "scroll-translations:language-key" + '=' + $(this).attr('value');
        });
        $('select[name="scroll-versions:version-name"] > option[selected]').each(function() {
            scmQueries = scmQueries + '&' + "scroll-versions:version-name" + '=' + $(this).attr('value');
        });
        $('select[name="scroll-versions:variant-name"] > option[selected]').each(function() {
            scmQueries = scmQueries + '&' + 'scroll-versions:variant-name' + '=' + $(this).attr('value');
        });
        return scmQueries;
    }


    window.SCROLL_WEBHELP.search.getSearchQueryParametersForContext = function(name, value) {
        if (isScrollSearchEnabled()) {
            var version = name === "scroll-versions:version-name" ? value : undefined;
            var variant = name === "scroll-versions:variant-name" ? value : undefined;
            var language = name === "scroll-translations:language-key" ? value : undefined;
            var cql = createCqlQuery($('meta[name=searchQuery]').attr('content'), version, variant, language);
            return [{ key: 'cql', value: cql }];
        }
        return [];
    };

})($);

(function($) {
    window.SCROLL = window.SCROLL || {};

    SCROLL.initPageTree = function() {
        $('.ht-pages-nav-top').scrollTree({
            'contextPath': AJS.contextPath(),
            'css': {
                'ancestor': 'active',
                'current': 'active',
                "leaf": 'leaf',
                'loading': 'sp-loading',
                'collapsed': 'collapsed',
                'expanded': 'open',
                'error': 'sp-error'
            },
            'renderChildrenUl': function () {
                return '<ul class="nav ht-pages-nav-sub"></ul>';
            },
            'renderChildLi': function (child, opts) {
              	/* CUSTOM - Excludes sitemap.xml from the displayed page tree - works globally */
              	if (~child.title.toLowerCase().indexOf('sitemap.xml')) {
      				return ''
  				}

                /* CUSTOM - Filters the Missing documentation pages pages from the displayed page tree - works globally*/
                if (~child.title.toLowerCase().indexOf('missing documentation pages')) {
                    return ''
                }
              	
                // CUSTOM - Added removal of trailing slashes from the pathname in the "current" comparison
                var aclass = (window.location.pathname.replace(/\/$/, '') == child.link) ? 'current' : '';

                var node = '<li class="' + opts.css[child.type] + '"><a class="ht-nav-page-link ' + aclass + '" href="' + child.link + '">' + SCROLL_WEBHELP.escapeHtml(child.title) + '</a>';
                if (child.children) {
                    node += '<span class="sp-toggle sp-aui-icon-small ht-pages-nav-toggle">' +
                      	/* Custom: No SVGs (with duplicate IDs) for faster load times */
                        /*'<svg id="icon-minus" width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
                        '    <g fill="#CCCCCC">' +
                        '        <rect x="7" y="11" width="10" height="2"></rect>' +
                        '    </g>' +
                        '</svg>' +
                        '<svg id="icon-plus" width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
                        '    <g fill="#CCCCCC">' +
                        '        <rect x="11" y="7" width="2" height="10"></rect>' +
                        '        <rect x="7" y="11" width="10" height="2"></rect>' +
                        '    </g>' +
                        '</svg>' +*/
                        '</span>';
                }
                node += '</li>';

                return node;
            }
        });
    };

})($);

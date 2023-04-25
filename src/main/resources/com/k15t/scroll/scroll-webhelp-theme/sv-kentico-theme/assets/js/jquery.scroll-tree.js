(function($) {
 
    'use strict';
 
    // http://learn.jquery.com/plugins/basic-plugin-creation/
    // http://learn.jquery.com/plugins/advanced-plugin-concepts/
    $.fn.scrollTree = function (options) {
 
        var DEFAULT_OPTIONS = {
            'contextPath': '/',
            'css': {
                'ancestor': 'active',
                'current': 'active',
                'leaf': 'leaf',
                'loading': 'sp-loading',
                'collapsed': 'sp-collapsed',
                'expanded': 'sp-expanded',
                'error': 'sp-error'
            },
            'renderChildrenUl': function () {
                return '<ul class="nav"></ul>';
            },
            'renderChildLi': function (child, opts) {
                return '<li class="' + opts.css[child.type] + '"><span class="sp-toggle"></span><a href="' + child.link + '">' + SCROLL_WEBHELP.escapeHtml(child.title) + '</a></li>';
            }
        };
 
        var viewportId = $(this).data('viewportId');
        var rootLink = $(this).data('root');
        var currentLink = $(this).data('current');
 
        // CUSTOM
        // PageTreeFilter-specific variables
        var confluenceSpaceRootId = $(this).data('confluenceid');
        var currentTitle = $(this).data('currenttitle');
        var label;     
		// Calls functions defined in theme.custom.js
		var devModelSwitcherSupported = isDevModelSwitcherSupported();
		
        // Sets the label used for filtering in the documentation tree        
        // Calls functions defined in theme.custom.js
      	if (devModelSwitcherSupported) {
            // Gets the currently active dev model, without the possible 'all|' prefix
            var currentModel = getCurrentDevModel();
            if (currentModel.indexOf("all|") === 0) {
        		currentModel = currentModel.split("|")[1];
    		}
          
            // Inverts the currently active dev model, because we use negative filtering
            label = (currentModel === 'mvc') ? 'pe' : 'mvc';            
            }
        // No longer needed, spaces without the dev model switcher now use the default page tree
        /*else {
            label = 'noFiltering';
        }*/
            
        var opts = $.extend(true, DEFAULT_OPTIONS, options);
 
        return this.each(function () {
            var $rootUl = $(this);
 
            //loadChildren($rootUl, rootLink, currentLink); // ORIGINAL
            loadChildren($rootUl, rootLink, currentTitle, currentLink); // CUSTOM
            setupEventHandling($rootUl);
 
            return this;
        });
 
 
        //function loadChildren($ul, parentLink, currentLink) { // ORIGINAL
        function loadChildren($ul, parentLink, currentTitle, currentLink) { // CUSTOM
            var $parentLi = $ul.closest('li');
            if ($parentLi) {
                $parentLi.removeClass(opts.css.collapsed)
                    .addClass(opts.css.loading);
            }
			if (!devModelSwitcherSupported) {
				// ORIGINAL VIEWPORT ENDPOINT
				$.get(opts.contextPath + '/rest/scroll-viewport/1.0/tree/children', {
                'viewportId': viewportId,
                'root': rootLink,
                'parent': parentLink || $parentLi.find('> a').attr('href'),
                'current': currentLink || ''
				})
					.done(function success(children) {
						insertChildren($ul, children);
 
                    $parentLi.removeClass(opts.css.loading)
                        .addClass(opts.css.expanded);
					})
					.fail(function error(jqXHR, textStatus, errorThrown) {
						$parentLi.removeClass(opts.css.loading)
							.addClass(opts.css.error);
					})
				;
			}
			else {						           
				// CUSTOM ENDPOINT 1
				// Called on page load
				$.get(opts.contextPath + '/rest/treefilter/1.0/getchildrenrecursive', {
					'spaceId': confluenceSpaceRootId,
					'parent': parentLink || $parentLi.find('> a').text(),
					'current': currentTitle || '',
					'label': label,
					'isLatest':	(CONFIG.CONFLUENCE_SPACE_KEY === CONFIG.DOC_ROOT_URL_SPACE_KEY)
				})
					.done(function success(children) {
						insertChildren($ul, children);
	 
						$parentLi.removeClass(opts.css.loading)
							.addClass(opts.css.expanded);
					})
					.fail(function error(jqXHR, textStatus, errorThrown) {
						$parentLi.removeClass(opts.css.loading)
							.addClass(opts.css.error);
					})
				;
			}
        }
 
        // CUSTOM
        function loadChildrenOutsideOriginalPath($ul, parentTitle, currentTitle) {
            var $parentLi = $ul.closest('li');
            if ($parentLi) {
                $parentLi.removeClass(opts.css.collapsed)
                    .addClass(opts.css.loading);
            }
          
          	// CUSTOM ENDPOINT 2 - called when opening subtrees outside the original page load request
            // uses DOM to persist already loaded page links to avoid repeated use of recursion
            $.get(opts.contextPath + '/rest/treefilter/1.0/getchildren', {
                'spaceId': confluenceSpaceRootId,
                'parent': parentTitle || $parentLi.find('> a').text(),
              	'parentLink':  $parentLi.find('> a').attr('href'),
                'label': label				
            })
                .done(function success(children) {
                    insertChildren($ul, children);

                    $parentLi.removeClass(opts.css.loading)
                        .addClass(opts.css.expanded);
                })
                .fail(function error(jqXHR, textStatus, errorThrown) {
                    $parentLi.removeClass(opts.css.loading)
                        .addClass(opts.css.error);
                })
            ;
        }
      
        function insertChildren($ul, children) {
            $ul.html('');
            $.each(children, function (idx, child) {
                var $childLi = $(opts.renderChildLi(child, opts)).appendTo($ul);
 
                if (child.children) {
                    if (child.children.length) {
                        $childLi.addClass(opts.css.expanded);
                        var $childrenEl = $(opts.renderChildrenUl()).appendTo($childLi);
                        insertChildren($childrenEl, child.children);
 
                    } else {
                        $childLi.addClass(opts.css.collapsed);
                    }
                } else {
                    $childLi.addClass(opts.css.leaf);
                }
            });
        }
 
 
        function setupEventHandling($rootUl) {
            $rootUl.on('click', '.sp-toggle', function () {
                var $li = $(this).parent('li');
                if ($li.is('.' + opts.css.collapsed)) {
                    openNode($li);
 
                } else if ($li.is('.' + opts.css.expanded)) {
                    closeNode($li);
 
                } else {
                    // we don't have children -> no-op
                }
            });
        }
 
 
        function openNode($li) {
            if ($li.has('ul').length) {
                // children have been loaded, just toggle classes
                $li.removeClass(opts.css.collapsed)
                    .addClass(opts.css.expanded);
            } else {
                // children have to be loaded
                var $childrenEl = $(opts.renderChildrenUl()).appendTo($li);
				if (!devModelSwitcherSupported) {
					loadChildren($childrenEl); // ORIGINAL
				}
				else {
					loadChildrenOutsideOriginalPath($childrenEl); // CUSTOM
				}
			}
        }
 
 
        function closeNode($li) {
            $li
                .removeClass(opts.css.expanded)
                .addClass(opts.css.collapsed);
        }
    };
 
})($);
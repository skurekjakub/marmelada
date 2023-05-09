(function($) {
    /**
     *
     * K15t Help Theme
     * Modified Main Javascript
     *
     **/

    window.SCROLL_WEBHELP = window.SCROLL_WEBHELP || {};

    window.SCROLL_WEBHELP.escapeHtml = function(text) {
        return $('<div />').text(text).html();
    };
    
    var searchURL = 'search.json';
    var viewport = 'desktop';
    var svdropdown = false;
    // var pageId;

    // firefox detection
    var isFirefox = typeof InstallTrigger !== 'undefined'; // Firefox 1.0+
    var isIE = (navigator.userAgent.indexOf("MSIE") > 0) || (navigator.userAgent.indexOf("Trident") > 0);
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0; // At least Safari 3+: "[object HTMLElementConstructor]"

    $(document).ready(function() {

        // pageId = $('body').attr('pageid');
        /* Set Type of Device */
        checkDevice(false); // CUSTOM - false parameter to indicate that the call is on the initial page load

        /* init Sidebar Functions */
        // initDragbar();
        initSidebar();
        checkGrid();

        /* init Search Functions */
        initSearch();
        initButtons();

        initFooter();
        // setContentWidth(); // CUSTOM content width adjustments

        /* init Keyboard */
        initKeyboard();

        $('.sp-picker').change(function () {
            $(this).closest('form').trigger('submit');
        });

        /* handle links to anchors correctly with the headerbar */
        scrollToPosition();

        //setTimeout(function() {$('#ht-loader').hide();}, 500);
        $('#ht-loader').hide();
    });

    /*======================================
     =            Resize Sidebar            =
     ======================================*/

    function initDragbar() {
        setDragbar(parseInt(getCookie('sidebar-width')));

        $('#ht-sidebar-dragbar').mousedown(function (e) {
            e.preventDefault();
            $(document).mousemove(function (e) {
                var mousex = e.pageX + 2;

                if (mousex < 190 || mousex > $(window).innerWidth() - 455)return;

                if (mousex < 220)$('#ht-sidebar').addClass('small');
                else $('#ht-sidebar').removeClass('small');


                setDragbar(mousex);
                setCookie('sidebar-width', mousex);

                checkGrid();

                $(document).mouseup(function (e) {
                    $(document).unbind('mousemove');
                });
            });
        });

        setScrollVersionSelect();
    }

    function setDragbar(val) {
        if (viewport != 'desktop')return;

        if (val == isNaN())val = 295;

        $('#ht-sidebar').width(val);
        if (val < 220)$('#ht-sidebar').addClass('small');

        $('#ht-wrap-container').css("left", val + 10);
        $('#ht-headerbar').css('left', val);
    }

    function endDragbar() {
        if ($('#ht-sidebar').attr('style') == '')return;
        $('#ht-sidebar').attr('style', '');
        $('#ht-wrap-container').attr('style', '');
    }

    function setScrollVersionSelect(visible) {
        $.each($('.ht-scroll-versions-select select'), function (index, val) {
            setDropdown($(this));
        });
    }


    /*=========================================
     =            Toggle Sidebarnav            =
     =========================================*/

    function initSidebar() {
        if (window.SCROLL && window.SCROLL.initPageTree) {
            window.SCROLL.initPageTree();
        }

        $('#ht-menu-toggle').bind('click', function (e) {
            e.preventDefault();
            setTimeout(toggleSidebar(), 0.05);
        });
    }

  
    /*=========================================
     =               Headerbar                =
     =========================================*/

    function scrollToPosition() {
        var duration = 500;
        var additionalOffset = 10;

        if (window.location.hash) {
            // Net to put it at the end of the event loop for making it work in IE :-(
            setTimeout(function() {
                $(window).scrollTo(
                    document.getElementById(window.location.hash.substr(1)),
                    {
                        offset: -($('#ht-headerbar').height() + additionalOffset),
                        duration: duration,
                        interrupt: true,
                        axis: 'y'
                    }
                );
            }, 0);
        }

        $('.ht-content').on('click', 'a[href^="'+location.pathname+'\\#"], a[href^=\\#]', function(e) {
            e.preventDefault();
            var element = document.getElementById(this.hash.substr(1));
            if (!element) {
                // look for element with encoded ID - hash is provided different in Firefox
                element = document.getElementById(decodeURI(this.hash.substr(1)));
            }
            $(window).stop(true).scrollTo(
                element,
                {
                    offset: -($('#ht-headerbar').height() + additionalOffset),
                    duration: duration,
                    interrupt: true,
                    axis: 'y'
                }
            );

            // PushState is not supported for local files (file:///...)
            // See https://bugs.chromium.org/p/chromium/issues/detail?id=301210
            if (history && location.protocol.substr(0,4) != 'file') {
                history.pushState({}, '', $(e.target).attr('href'));
            }
            return false;
        });
    }


    /*=========================================
     =               Search                    =
     =========================================*/

    function initSearch() {
        var debounce = function(func, wait) {
            var timeout;
            var result;
            return function() {
                var args = arguments;
                var context = this;
                var debounced = function() {
                    result = func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(debounced, wait);
                return result;
            };
        };

        var debouncedSearch = debounce(doSearch, 200);

        var input = $('#search input.search-input');
        input.on('focus', function (e) {
            searchFieldActive = true;

            input.on('blur', function (e) {
                searchFieldActive = false;
            });
        });


        input.on('input', function(e) {
            var str = input.val();
            if (str.length >= 3) {
                debouncedSearch(str);
            }
            
            if (str.length == 0) {
                $('.ht-search-dropdown').removeClass('open');
            }
            
        });

        input.on('keydown', function (e) {
            if (e.which === 13) {
                performSearch(); // CUSTOM
            }
        });

        $('form#search').on('submit', function() { // CUSTOM
            return false;
        });
    }

    function openSearch() {
        $('body').bind('click', function (e) {
            if (!$(e.target).parents('#ht-search').length && $('#ht-search').hasClass('open')) {
                $('body').unbind('click');
                closeSearch();
            }
        });
        $('#ht-search').addClass('open');
        setTimeout(function () {
            $('.ht-search-clear').addClass('show');
        }, 250);
        searchFieldActive = true;
        $('.search-input')[0].focus();
    }

    // CUSTOM: We only hide search suggestions on esc
    function closeSearch() {
        input = $('#ht-search');
        //input.find('input').val('');
        //input.find('input').blur();
        //input.removeClass('open');
        //$('.ht-search-clear').removeClass('show');
        input.find('.ht-search-dropdown').removeClass('open');
      
        // CUSTOM - Removes the hover class from items selected in the search drop-down
		var selectedSearchLinkElement = $(".ht-search-dropdown a.hover");
        selectedSearchLinkElement.removeClass("hover");
      
        $(document).unbind('keydown');
    }

    // CUSTOM - commented out, not used in our implementation
    /*function navigateToSearchResultsPage(query) {
        if (window.SCROLL_WEBHELP && window.SCROLL_WEBHELP.search) {
            window.SCROLL_WEBHELP.search.navigateToSearchPage(query);
            closeSearch();
        }
    }*/


    function doSearch(query) {
        var dropdown = $('.ht-search-input .ht-search-dropdown');
        var resultsList = dropdown.find('ul');
      	// CUSTOM - Escapes forbidden characters
		query = encodeURIComponent(query);
      
        resultsList.empty();

        var handleSearchResults = function(searchResults, query) {
            // $(document).unbind('keydown');

            $.each(searchResults, function (index, searchResult) {
                resultsList.append('<li n="' + index + '" class="search-result"><a href="' + searchResult.link + '">' + SCROLL_WEBHELP.escapeHtml(searchResult.title) + '</a></li>');
            });

            // CUSTOM - Broken down into individual component elements, needed to securely display the query value
            // CUSTOM - Added the 'decodeURIComponent()' call to the displayed search query (stops displaying of encoded "Search:" values in the search suggester drop-down)
            var keybutton_li = $('<li class="search-key" n="' + searchResults.length + '"></li>');
            var keybutton_link = $('<a class="search-key-button" href="#">Search:&nbsp;</a>');
            var keybutton_searchedTerm = $('<b></b>').text(decodeURIComponent(query));
            var keybutton = keybutton_li.append(keybutton_link.append(keybutton_searchedTerm));
            
            keybutton.bind('click', function(e) {
                performSearch(); // CUSTOM
                e.preventDefault();
            });
            resultsList.append(keybutton);

            resultsList.children('li').each(function(index, item) {
                var li = $(item);
                li.bind('mouseover', function () {
                    resultsList.find('li a').removeClass('hover');
                    li.find('a').addClass('hover');
                });
            });

            dropdown.addClass('open');

            var input = $('#search input.search-input');

            input.on('keydown', function (e) {
                switch (e.which) {
                    case 38:
                        dropdownKeydown(-1, dropdown);
                        break;
    
                    case 40:
                        dropdownKeydown(1, dropdown);
                        break;
    
                    default:
                        return;
                }
    
                e.preventDefault();
            });
        };

        if (window.SCROLL_WEBHELP && window.SCROLL_WEBHELP.search) {
            window.SCROLL_WEBHELP.search.performSearch(query, handleSearchResults);
        }
    }

    function dropdownKeydown(direction, dropdown) {
        var itemcount = dropdown.find('a').length;
        var currentitem = parseInt(dropdown.find('a.hover').parent().attr('n'));
        if (isNaN(currentitem))currentitem = -1;

        var nextitem = currentitem + direction;
        var dropdownHeight = dropdown.height() - 2;

        var itemheight = parseInt(dropdown.find('a.hover').outerHeight());

        if (nextitem < 0 || nextitem >= itemcount)return;

        $.each(dropdown.find('a'), function (index, val) {
            if (index == currentitem)$(this).removeClass('hover');
            if (index == nextitem) {
                $(this).addClass('hover');

                if ((itemheight * (index + 1)) - dropdown.scrollTop() > dropdownHeight) {
                    dropdown.scrollTop((itemheight * (index + 1)) - dropdownHeight);
                } else if ((itemheight * (index + 1)) - dropdown.scrollTop() < itemheight && dropdown.scrollTop() > 0) {
                    dropdown.scrollTop(itemheight * index);
                }
            }
        });
    }  

  
    // CUSTOM: Performs a search
    function performSearch() {
		// Attempts to get a selected search drop-down link element
        var selected = $('.ht-search-dropdown a.hover');        

		if (selected.length != 0) {
            if (selected.is('.search-key-button')) {
		        // If the selected item is the final "Search: <query>" element, opens the search result page 
                kenticoThemeOpenSearchResultsPage(); // Function defined in theme.custom.js
            } else {
				// If the selected item is a page result, redirects directly to given documentation page
                window.location.href = selected.attr('href');
            }
        } else {
			// Opens the search result page (default case)
            kenticoThemeOpenSearchResultsPage(); // Function defined in theme.custom.js
        }
    }


    function initButtons() {

        $('#ht-search-button').bind('click', function (e) {
            e.preventDefault();
            openSearch();
        });

        $('#searchButton').bind('click', function (e) {
            e.preventDefault();
          	if ($(".search-input").hasClass("show") || $(".search-input").is(":visible")) {
            	performSearch();
        	} else {
                $(".search-input").addClass("show");
            }
        });

        $('.ht-search-clear').bind('click', function (e) {
            e.preventDefault();
            closeSearch();
        });
    }

    /*===================================
     =       Header responsivity        =
     ===================================*/

    (function() {
        var $openSearch = $('.js-header-search-open');
        var $closeSearch = $('.js-header-search-close');
        var $search = $('.js-header-search-box');
        var transitionMs = 250;

        $openSearch.click(function(e) {
            $search
                .css("display", "flex")
                .hide()
                .fadeIn(transitionMs);
        });

        $closeSearch.click(function(e) {
            $search.fadeOut(transitionMs);
        });

        var $menuToggle = $('.js-menu-toggle');
        var $sidebar = $('#ht-sidebar');

        function showMenu() {
            $menuToggle.addClass('is-active');
            $sidebar.fadeIn(transitionMs);
        }

        function hideMenu() {
            $menuToggle.removeClass('is-active');
            $sidebar.fadeOut(transitionMs);
        }

        $menuToggle.click(function(e) {
            if ($menuToggle.hasClass('is-active')) {
                hideMenu();
            } else {
                showMenu();
            }
        })

        window.addEventListener('click', function(e) {
            if (!$menuToggle[0].contains(e.target) && !$sidebar[0].contains(e.target)) {
                hideMenu();
            } 
        });
    })();


    /*================================
     =            Dropdown            =
     ================================*/

    function setDropdown(select) {
        var container = select.parent();
        var svg = '<svg width="10px" height="10px" viewBox="0 0 10 10" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g class="ht-select-button-icon"><path d="M2,3 L8,3 L5,7 L2,3 Z"></path></g></svg>';
        var toggle = $('<a class="ht-select-button"><span>' + createOptionText(select.find('option:selected')) + '</span>' + svg + '</a>');
        container.append(toggle);

        var label = container.parent().find('label').remove();
        toggle.prepend(label);

        var dropdown = $('<div class="ht-dropdown ht-dropdown-select"><ul></ul></div>');
        container.append(dropdown);

        var allAccessible = allEntriesAccessible(select);
        $.each(select.find('option'), function (index, val) {
            var item = $('<li n="' + index + '"><a data-scroll-integration-name="' + select.attr('name') + '" data-scroll-integration-title="' + $(this).text() + '" data-scroll-integration-value="' + $(this).attr('value') + '">' + createOptionText($(this), !allAccessible) + '</a></li>');
            dropdown.find('ul').append(item);
        });

        select.on('change', function () {
            var val = select.val();
            toggle.find('span').text(select.find('option:selected').text());
        });

        toggle.bind('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (viewport == 'mobile' && !(isFirefox || isIE)) {
                openSelect(select);
                return false;
            }


            if ($(this).hasClass('active')) {
                toogleDropdown(container, false);
                $(this).removeClass('active');
            } else {
                $.each($('.' + container.attr('class')), function (index, val) {
                    if ($(this).find('.ht-select-button').hasClass('active')) {
                        toogleDropdown($(this), false);
                    }
                });

                toogleDropdown(container, true);
                $(this).addClass('active');
            }

            return false;
        });
    }

    /** Check if all of the entries in the given select are runtime accessible (currently only relevant for versions). */
    function allEntriesAccessible(select) {
        var allAccessible = true;
        if (select.attr('name') === 'scroll-versions:version-name') {
            $.each(select.find('option'), function () {
                allAccessible &= ($(this).attr('data-version-accessible') === 'true');
            });
        }
        return allAccessible;
    }

    /** Create the text for the drop-down entries (version entries may contain some extra info other than the property name). */
    function createOptionText(option, showVersionAccessibility) {
        var optionText = option.text();
        if (showVersionAccessibility) {
            var versionAccessible = option.attr('data-version-accessible');
            if (versionAccessible) {
                optionText += ' <span style="float: right; margin-left: 0.8em; color: #dddddd;';
                if (versionAccessible === 'true') {
                    optionText += 'visibility: hidden;';
                }
                optionText += '" class="k15t-icon-viewport"></span>';
            }
        }
        return optionText;
    }

    function toogleDropdown(container, open) {
        if (open) {
            $('body').bind('click', function (e) {
                e.preventDefault();
                if ($(e.target).is(container.find('*')))return;
                toogleDropdown(container, !open);
            });

        } else {
            $('body').unbind('click');
        }

        var toggle = container.find('.ht-select-button');
        var dropdown = container.find('.ht-dropdown');

        if (open) {
            toggle.addClass('active');
            dropdown.addClass('open');

            $.each(dropdown.find('li'), function (index, val) {
                $(this).bind('mouseover', function () {
                    dropdown.find('li a').removeClass('hover');
                    $(this).find('a').addClass('hover');
                });

                $(this).find('a').bind('click', function (e) {
                    e.preventDefault();

                    var name = $(e.target).closest('a').attr('data-scroll-integration-name');
                    var value = $(e.target).closest('a').attr('data-scroll-integration-value');
                    var title = $(e.target).closest('a').attr('data-scroll-integration-title');

                    toggle.find('span').text(title);

                    var target = window.location.pathname + '?' + name + '=' + value;

                    var context = toggle.closest('form').find('input[name=context]').val();
                    if (context) {
                        target += '&context=' + context;
                    }

                    window.location.href = target;
                });
            });
        } else {
            toggle.removeClass('active');
            dropdown.removeClass('open');
        }
    }

    /*===================================
     =            Init Footer            =
     ===================================*/
    function initFooter() {
        checkFooter();

        $('#ht-jump-top').bind('click', function (e) {
            e.preventDefault();
            $('body,html').animate({
                    scrollTop: 0},
                100);
        });
    }

    function checkFooter() {
        if ($('article.ht-content').outerHeight() < $(window).innerHeight()) {
            $('#ht-jump-top').fadeOut();
        } else {
            $('#ht-jump-top').fadeIn();
        }
    }


    /*=============================================
     =            Media Query Detection            =
     =============================================*/
    function checkDevice(resize) { // CUSTOM - resize parameter added to differentiate between page load and resize calls
        var i = parseInt($('#ht-mq-detect').css('width').replace('px', ''));

        switch (i) {
            case 1:
                viewport = 'mobile';
                break;

            case 2:
                viewport = 'potrait';
                break;

            case 3:
                viewport = 'landscape';
                break;

            case 4:
                viewport = 'desktop';
                break;

            case 5:
                viewport = 'desktop';
                break;
        }

        var baseUrl = $("meta[name='confluence-base-url']").attr("content");
        var spaceKey = $("meta[name='confluence-space-key']").attr("content").toLowerCase();
        var homePath = baseUrl;
		// Handling for cases where the version is displayed without a space key in the URL
		if (spaceKey !== CONFIG.DOC_ROOT_URL_SPACE_KEY) {
			homePath = homePath + '/' + spaceKey;
		}
        var currPath = $(location).attr('href');

        // No sidebar for homepages and search results + Collapsed small search box for smaller screens
        if ( !(currPath == homePath || currPath == (homePath + '/') || currPath.indexOf(homePath + '/search') >= 0) ){
            if (viewport == 'desktop') {
                if (!resize) { // Does not auto-open the sidebar when resizing
                    $('html').addClass('show-sidebar');
                }
            } else {
                $('html').removeClass('show-sidebar');
            }
          
          	if (viewport == 'desktop' || viewport == 'landscape') {
              	$('.search-input').addClass('show');
            } else {
              	$('.search-input').removeClass('show');
            }
        }

        // Once rendered, add CSS animation class to sidebar element
        setTimeout(function(){$('#ht-sidebar').addClass('animate');},500);
      	setTimeout(function(){$('.search-input').addClass('animate');},500);
    }


    /*=====================================
     =            Window Resize            =
     =====================================*/
    var rtime = new Date(1, 1, 2000, 12, 0, 0);
    var timeout = false;
    var delta = 200;
    $(window).resize(function () {
        rtime = new Date();
        if (timeout === false) {
            timeout = true;
            setTimeout(resizeend, delta);
        }
    });

    function resizeend() {
        if (new Date() - rtime < delta) {
            setTimeout(resizeend, delta);
        } else {
            timeout = false;
            checkFooter();
            checkDevice(true); // CUSTOM - true parameter to indicate that the call is on resize
            checkGrid();
            // setContentWidth();
        }
    }

    function openSelect(selector) {
        var element = $(selector)[0], worked = false;

        if (document.createEvent) { // all browsers
            var e = document.createEvent("MouseEvents");
            e.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            worked = element.dispatchEvent(e);

        } else if (element.fireEvent) { // ie
            worked = element.fireEvent("onmousedown");
        }
        if (!worked) { // unknown browser / error

        }
    }


    /*=====================================
     =             Keyboard              =
     =====================================*/
    var searchFieldActive;
    var lastKey;

    function initKeyboard() {
        searchFieldActive = false;

        $('body').bind('keyup', function (e) {
            if (searchFieldActive && e.which != 27) {
                return;
            }

            switch (e.which) {
                case 219: // [
                    if (viewport !== 'desktop') {
                        toggleSidebar();
                    }
                    break;

                case 191: // /
                    if (!sidebarExpanded) {
                        openSearch();
                    }
                    break;

                case 71: // g
                    if (lastKey == 71) {
                        if (!sidebarExpanded) {
                            openSearch();
                        }
                    }
                    break;

                case 27: // esc
                    closeSearch();
                    break;
            }

            lastKey = e.which;
        });
    }


    /*=====================================
     =              Cookies               =
     =====================================*/

    function setCookie(cname, cvalue) {
        if (window.location.origin == 'file://') {
            try {
                localStorage.setItem(cname, cvalue);
            } catch (e) {
                console.log('Saving the state of the drag-bar is not supported because localStorage is not available');
            }
        } else {
            var d = new Date();
            d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
        }
    }

    function getCookie(cname) {
        if (window.location.origin == 'file://') {
            try {
                var value = localStorage.getItem(cname);
                if (typeof value != 'undefined') {
                    return value;
                }
            } catch (e) {
                console.log('Saving the state of the drag-bar is not supported because localStorage is not available');
            }
        } else {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
        }

        return "";
    }

    /*=====================================
     =               GRID                 =
     =====================================*/

    function checkGrid() {
        if ($('#ht-wrap-container').width() > 640) {
            $('#ht-wrap-container').addClass('sp-grid-float');
            $('#ht-wrap-container').removeClass('sp-grid-fluid');
            // Puts side cell after main cell
            $('.sp-grid-cell.sp-grid-60').first().after($('.sp-grid-cell.sp-grid-40'));
        } else {
            $('#ht-wrap-container').addClass('sp-grid-fluid');
            $('#ht-wrap-container').removeClass('sp-grid-float');
            // Puts main cell before side cell
            $('.sp-grid-cell.sp-grid-60').first().before($('.sp-grid-cell.sp-grid-40'));
        }        
    }

    /*=====================================
     =             Clipboard              =
     =====================================*/
    (function(){
        var clipboardTimeout;

        var clipboard = new ClipboardJS('.js-codeClipboard', {
            target: function(trigger) {
                var $panel = $(trigger).closest('.js-codePanel');
                var $code = $panel.find('.js-code');
            
                return $code[0];
            }
        });

        clipboard.on('success', function (e) {
            var $trigger = $(e.trigger);
            $trigger.addClass('is-copied');

            if (clipboardTimeout) {
                window.clearTimeout(clipboardTimeout);
            }

            clipboardTimeout = window.setTimeout(function() {
                $trigger.removeClass('is-copied');
            }, 2000);

            e.clearSelection();
        });
    }())
})($);

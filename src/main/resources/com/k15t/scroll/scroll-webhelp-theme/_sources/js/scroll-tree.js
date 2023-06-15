(function($) {
    window.SCROLL = window.SCROLL || {};

    SCROLL.initPageTree = function() {

        // var queryString = window.location.search.slice(1);
        var pageId = $("body").attr('pageid');

        // if (queryString) {
        //     var param = queryString.split('=');
        //     if (param.length === 2 && param[0] === 'pageId') {
        //         pageId = param[1];
        //     }
        // }

        $('a.ht-nav-page-link').each(function() {
            if ($(this).attr('data-destpageid') === pageId) {
                $(this).addClass('current');
            }
        });

        $('a.ht-nav-page-link.current').parents('li').addClass('active open').removeClass('collapsed');

    };

    if (window.SCROLL && window.SCROLL.initPageTree) {
        $(document).ready(window.SCROLL.initPageTree);
    }
}($));




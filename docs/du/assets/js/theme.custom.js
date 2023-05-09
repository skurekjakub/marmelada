// ====================================EXPERIMENTAL=========================================
// Page TinyID Generator - programmatically generates page identifiers
// Currently only used when retrieving page HelpService identifiers via 'Get HelpService ID'
// Accessible from CONFIG.CONFLUENCE_PAGE_TINYID
// https://confluence.atlassian.com/confkb/how-to-programmatically-generate-the-tiny-link-of-a-confluence-page-956713432.html
// The long to byte array conversion is taken from this source:
// https://stackoverflow.com/questions/8482309/converting-javascript-integer-to-byte-array-and-back

// Converts the page id to a byte array for further encoding
var longToByteArray = function longToByteArray(long) {
    var byteArray = [0, 0, 0, 0];
    for ( var index = 0; index < byteArray.length; index ++ ) {
      var byte = long & 0xff;
      byteArray [ index ] = byte;
      long = (long - byte) / 256 ;
    }
    return byteArray;
};


// Encodes provided page id in Base-64
var pageIdToB64 = function pageIdToB64(pageId) {
    return btoa(
        longToByteArray(pageId)
            .map(String.fromCharCode)
            .map(function (s) {
                return s[0];
            })
            .join("")
      )
      .replace(/=/g,"");
};


// Generates a Confluence page identifier from the provided B-64 encoded page id
// Taken directly from Confluence Server 7.2 source code
// com.atlassian.confluence.pages.TinyId
var generateTinyId = function generateTinyId(btoadId) {
    var padding = true;
    var tinyString = "";

    for (var i = btoadId.length - 1; i >= 0 ; i--) {

        var character = btoadId.charAt(i);

        if (character === '=' || character == '\n')
            continue;

        if (padding && character === 'A')
            continue;

        padding = false;

        if (character === '/') {
            tinyString = '-' + tinyString;
        }
        else if (character === '+') {
            tinyString = '_' + tinyString;
        }
        else {
            tinyString = character + tinyString;
        }
    }

    if (tinyString.length > 0) {
        var lastChar = tinyString.charAt(tinyString.length - 1);

        // CONF-9299 some email clients don't like URLs that end with a punctation
        if (lastChar === '-' || lastChar === '_')
            tinyString += '/';
    }

    return tinyString;
};
// ==================================END EXPERIMENTAL=======================================


// Dynamically computed properties
/** The Confluence 'TinyId' of the current page */
CONFIG.CONFLUENCE_PAGE_TINYID = generateTinyId(pageIdToB64(CONFIG.CONFLUENCE_PAGE_ID));


// ============================ page Url ID retriever =====================================
var displayPageUrlId = function displayPageUrlId(pageId) {
    // Use computed TinyID
    var tinySuffix = CONFIG.CONFLUENCE_PAGE_TINYID;
    if (tinySuffix) {
        // var array = tinySuffix.split("/");
        $.ajax({
            url: CONFIG.HELPSERVICE_URLID_ENDPOINT + tinySuffix,
            success: function (result) {
                var response = JSON.parse(result);
                if (response.hasOwnProperty("Identifier")) {
                    $("#pageUrlId").text(" Help Service ID: " + response.Identifier + " (TinyID: " + tinySuffix + ")");
                }
                else {
                    $("#pageUrlId").text(" Help Service ID: " + response.Error);
                }
            },
            timeout: 800
        });
    }
    else {
        $("#pageUrlId").text("Error when generating the page tiny ID. See the console for details.");
    }
};


// ============================ PRISM WHITESPACE NORMALIZATION CONFIG ============================
Prism.plugins.NormalizeWhitespace.setDefaults({
    'remove-trailing': true,
    'remove-indent': true,
    'left-trim': true,
    'right-trim': true,
    // Does not preserve comment highlight on next line
    // 'break-lines': 80,
    'remove-initial-line-feed': false,
    'tabs-to-spaces': 4
});


// ============================ FEEDBACK COLLECTOR ============================

window.ATL_JQ_PAGE_PROPS = {
    "triggerFunction": function (showCollectorDialog) {
        $("#feedback-link").click(function (e) {
            e.preventDefault();
            showCollectorDialog();
        });
    },
    // Sets the collector dialog field values
    fieldValues: function () {
        var values = {};
        values.summary = $('[name="confluence-page-title"]').attr('content');
        values.priority = '6';
        // Page name
        values.customfield_14800 = $('[name="confluence-page-title"]').attr('content');
        // Space key
        values.customfield_14801 = CONFIG.CONFLUENCE_SPACE_KEY;

        return values;
    }
};

// ============================ PDF EXPORT  ============================
var exportPdf = function exportPdf() {
    var documentBody = $("#ht-content");
    html2pdf(documentBody);    
};

// ============================ PAGE TINY LINKS ============================

// Gets the page tiny link URL using REST and shows the page link panel
var openPageLink = function openPageLink(pageID) {
    if (CONFIG.CONFLUENCE_PAGE_TINYID) {
        togglePageLinkPanel(CONFIG.BASE_URL + '/x/' + CONFIG.CONFLUENCE_PAGE_TINYID);
    } else {
        togglePageLinkPanel(window.location.href);
    }
};

var togglePageLinkPanel = function togglePageLinkPanel(tinyUrl) {
    $("#page-link-textbox").attr("value", tinyUrl);
    if ($("#page-link-panel").hasClass("show")) {
        $("#page-link-panel").removeClass("show");
    }
    else {
        $("#page-link-panel").addClass("show");
    }
};

// Attempts to copy the page link value to the clipboard
var copyPageLinkToClip = function copyPageLinkToClip() {
	if (navigator.clipboard === undefined) {
		Snackbar.show({text: "An error occurred while copying the page link to the clipboard", pos: 'top-right', showAction: false, customClass: 'box-general box-warning', duration: '3500', backgroundColor: '#FFEBEB', textColor:'#151515' });
	} else {
		navigator.clipboard.writeText($("#page-link-textbox").attr("value"))
			.then(() => {
				Snackbar.show({text: "Page link copied", pos: 'top-right', showAction: false, customClass: 'box-general box-info', duration: '2500', backgroundColor: '#EEF3FC', textColor:'#151515' });
			})
			.catch(() => {
                Snackbar.show({text: "An error occurred while copying the page link to the clipboard", pos: 'top-right', showAction: false, customClass: 'box-general box-warning', duration: '3500', backgroundColor: '#FFEBEB', textColor:'#151515' });
            });
	}
};

// Closes the page link panel
const closePageLink = () =>  $("#page-link-panel").removeClass("show");


// ============================ HEADER SPACE SWITCHER ============================

// Converts the version number to the appropriate version text
const getVersionTextFromVersionId = (documentationVersion) =>
    DOCUMENTATION_VERSIONS.find((item) => item.versionId == documentationVersion).versionText;


// Translates the ID used by the documentation help service to Kentico version text
const getVersionTextFromHelpServiceId = (helpServiceVersion) =>
    DOCUMENTATION_VERSIONS.find((item) => item.helpServiceVersion == helpServiceVersion).versionText;


var versionSwitcherData;
/** Attempts to load version link data from the kentico.com help service
    The function is triggered on document load in include-bodyendscripts.vm -
    where we can conditionally include it due to scroll viewport contextual variables
    @param {string} tinyID - the short identifier of the target Confluence page */
var loadVersionLinkData = function loadVersionLinkData(tinyID) {
    $.ajax({
        dataType: "json",
        url: CONFIG.HELPSERVICE_LISTALTVERSIONLINKS_ENDPOINT + tinyID,
        timeout: 2000,
        tryCount : 0,
        retryLimit : 3,
        success: function (data) {
            // Save the version switcher data to a variable. Used in 'insertVersionLinks()' called from 'include-space-switcher.vm'.
            versionSwitcherData = data;
        },
        // Added retry logic in case the retrieval fails. Inspiration:
        // https://stackoverflow.com/questions/10024469/whats-the-best-way-to-retry-an-ajax-request-on-failure-using-jquery
        error : function (xhr, textStatus, errorThrown ) {
            if (textStatus == "timeout") {
                this.tryCount++;
                if (this.tryCount <= this.retryLimit) {
                    //try again
                    $.ajax(this);
                    return;
                }
                return;
            }
        }
    });
};


var versionLinkUpdateDone = false;

// Replaces the default space root version links with specific page links
var insertVersionLinks = function insertVersionLinks(versionData) {
    if (versionData === undefined)
    {
        openCloseVersionDdl();
        return;
    }

    if (versionLinkUpdateDone)
    {
        openCloseVersionDdl();
        return;
    }

    versionData.forEach(function (dataItem) {
    var linkElem = $(".js-menuDdl-version a:contains(" + getVersionTextFromHelpServiceId(dataItem.VersionUrlId) + ")");
        if (linkElem)
        {
            linkElem.attr("href", dataItem.Url);
            linkElem.addClass(" populated");
        }
    });

    $(".js-menuDdl-version a").toArray().forEach(function (element){
		if (!element.classList.contains("populated"))
		{
            element.classList.add("empty");

            // Special case 1 - the Xperience 13 docs link to a special page instead of the Home root for pages that do not have a direct equivalent
			if (element.textContent === "Xperience 13") {
                // The query string parameter contains the last URL segment (page title). Processed by javascript included directly on the "Missing documentation pages" page.
                element.setAttribute("href", CONFIG.XPERIENCE13_MISSING_PAGES_URL + "?ref=" + $(location).attr("href").split('/').pop());
                element.setAttribute("title", "The current page is not available in the Xperience 13 documentation. \r\nYou will be redirected to a general guidance page.");				
			// Special case 2 - the XP docs link to a special page instead of the Home root for pages that do not have a direct equivalent
			} else if (element.textContent === "Xperience by Kentico") {
				// The query string parameter contains the last URL segment (page title). Processed by javascript included directly on the "Missing documentation pages" page.
				element.setAttribute("href", CONFIG.XP_MISSING_PAGES_URL + "?ref=" + $(location).attr("href").split('/').pop());
                element.setAttribute("title", "The current page is not available in the Xperience by Kentico documentation. \r\nYou will be redirected to a general guidance page.");
			}
			else {
                element.setAttribute("title", "The current page is not available for this documentation version. \r\nYou will be redirected to the home page for this version.");
			}
		}
    });

    versionLinkUpdateDone = true;

    openCloseVersionDdl();
};



// Replaces the default space root version links with search page links, including the current parameters
var insertSearchVersionLinks = function insertSearchVersionLinks() {
    if (!versionLinkUpdateDone) {
        var versionLinkElems = $(".js-menuDdl-version a");
        versionLinkElems.each(function () {
            // Checks whether the linked version supports the dev model switcher
            // If it does not, removes label filtering of search results
            var linkElemHrefArray = this.href.split("/");
            var spaceKey = getDocVersion(linkElemHrefArray[linkElemHrefArray.length - 1]);

            // Adds a slash separator if the link does not already end in a slash
            var searchSlash = ((this.href.slice(-1) !== "/") ? "/" : "");

            if (CONFIG.CONFLUENCE_DEVMODEL_VERSIONSWITCHER_WHITELIST.indexOf(spaceKey) >= 0) {
                // Keeps the full query string if the linked version supports the dev model switcher
                this.href = this.href + searchSlash + "search" + window.location.search;
            }
            else {
                // Gets the query string parameters used by the current search results page
                var searchQueryStringParts = window.location.search.split("&");
                for (var i = searchQueryStringParts.length; i-- > 0;) {
                    // Removes the label filtering parameter
                    if (searchQueryStringParts[i].indexOf("l=") == 0) {
                        searchQueryStringParts.splice(i, 1);
                    }
                }

                this.href = this.href + searchSlash + "search" + searchQueryStringParts.join("&");
            }
        });
        versionLinkUpdateDone = true;
    }

    openCloseVersionDdl();
};


// Displays/hides the documentation type selector drop-down list
var openCloseDocTypeDdl = function () {
    $(".js-menuDdl-docType").toggleClass("show");
    $(".js-menuDdlBtn-docType").toggleClass("opened");
};

// Displays/hides the documentation version selector drop-down list
var openCloseVersionDdl = function () {
    $(".js-menuDdl-version").toggleClass("show");
    $(".js-menuDdlBtn-version").toggleClass("opened");
};


// Returns the documentation type for a specified space key
var getDocType = function (spaceKey) {
    var apiExamples = /api/i;
    var tutorial = /tutorial/i;
    if (apiExamples.test(spaceKey)) {
        return "API Examples";
    }
    if (tutorial.test(spaceKey)) {
        return "Tutorial";
    }
    return "Documentation";
};


// Returns the documentation version for a specified space key
var getDocVersion = function (spaceKey) {
	switch (spaceKey) {
		// Exceptions for spaces without a number in the space key and for "12sp"
		case "K12SP":
		case "API12SP":
		case "K12SPTutorial":
			return "12sp";
		case "XP":
		case "Tutorial":
		case "Api":
			return "xp";
		default:
			// Returns the number from the space key for "standard" cases
			return spaceKey.replace(/[^0-9]/g, '');
	}	
};


// Converts the version number to the appropriate tooltip (title) for the version link
var getVersionLinkTitle = function (version) {
    switch (version) {
        case "12sp":
            return "Kentico 12 Service Pack";
        default:
            return getVersionTextFromVersionId(version);
    }
};


// Builds links to the documentation space root for a specified documentation type and version
var buildDocLink = function buildDocLink(version, docType, useDocTypeInLinkText, isCurrent) {
    var spaceKey;
    var spaceKeySlash = "/";
	
	// Pattern for Xperience 13 or newer docs
    if (CONFIG.OBSOLETE_SPACE_KEY_FORMAT_VERSIONS.indexOf(version) === -1) {
		// The XP docs do not have a number prefix in their space keys
		var versionPrefix = (version === "xp") ? "" : version;
		
        switch (docType) {
            case "Tutorial":
                spaceKey = versionPrefix + "tutorial";
                break;
            case "API Examples":
                spaceKey = versionPrefix + "api";
                break;
            default:
                spaceKey = version;
        }		
		// Removes the space key from the link for the version (uses the base URL without a key in the path)
		if (spaceKey === CONFIG.DOC_ROOT_URL_SPACE_KEY) {
			spaceKey = "";
			spaceKeySlash = "";
		}
	// Pattern for older spaces with a version number suffix in the space key	
    } else {
        switch (docType) {
            case "Tutorial":
                spaceKey = "k" + version + "tutorial";
                break;
            case "API Examples":
                spaceKey = "api" + version;
                break;
            default:
                spaceKey = "k" + version;
        }
    }
		
    var baseUrl = $('[name="ajs-base-url"]').attr('content');
    var linkText = useDocTypeInLinkText ? docType : getVersionTextFromVersionId(version);
    var linkTitle = ' title="' + (useDocTypeInLinkText ? docType : getVersionLinkTitle(version)) + '"';

    var classAttribute = 'class="' + (isCurrent ? ' current' : '') + '"';

    return '<li><a href="' + baseUrl + spaceKeySlash + spaceKey + '"' + classAttribute + linkTitle + '>' + linkText + '</a></li>';
};


var loadDocVersionHeaderList = function loadDocVersionHeaderList(currentDocType, currentDocVersion) {
    var userLoggedIn = $('[name="confluence-user-logged-in"]').attr('content');

    // Filters out unavailable and unpublished versions
    var availableDocVersions = DOCUMENTATION_VERSIONS.filter(function (item) {
                // No API examples for 8.2 or older
        return ((currentDocType !== "API Examples") || (item.versionId !== "8" && item.versionId !== "81" && item.versionId !== "82")) &&
                // Hides the development version for public users
               ((userLoggedIn === "true") || (item.versionId !== CONFIG.DEV_DOCUMENTATION_VERSION_ID)) &&
                // Hides version 12, which is redirected to 12SP
               (item.versionId !== "12");
    });

    var docVersionLinks = "";

    availableDocVersions.forEach(function (item) {
        // Hides older documentation versions behind the 'All versions' expandable
        if (item.versionId == CONFIG.NEWEST_UNSUPPORTED_VERSION_ID) {
            docVersionLinks += '<li class="js-unsupported-versions">' +
                '<button class="header-ddl-button-nested js-unsupported-versions-button">' +
                'All versions' +
                '</button>' +
                '<ul class="menu-ddl-content nested-list docVersion js-unsupported-versions-list">';
        }

        docVersionLinks += buildDocLink(item.versionId, currentDocType, false, item.versionId == currentDocVersion);
    });

    docVersionLinks += '</ul></li>';

    $('.js-menuDdlBtn-version').html(getVersionTextFromVersionId(currentDocVersion));
    $('.js-menuDdl-version').html(docVersionLinks);
};


// Registers event listeners for the unsupported versions list
$(document).on('click', ".js-unsupported-versions-button", function () {
    $('.js-unsupported-versions-list').toggleClass('show');
    $('.js-unsupported-versions-list').toggleClass('opened');
});


var loadDocTypeHeaderList = function loadDocTypeHeaderList(currentDocVersion, currentDocType) {
    var availableDocTypes = ["Documentation", "Tutorial", "API Examples"];
    // Filters out the API Examples documentation type if the current version is 8.2 or older
    availableDocTypes = availableDocTypes.filter(function (item) {
        return (currentDocVersion !== "8" && currentDocVersion !== "81" && currentDocVersion !== "82") || (item !== "API Examples");
    });

    var docTypeLinks = "";
    availableDocTypes.forEach(function (item) {
        docTypeLinks += buildDocLink(currentDocVersion, item, true, item == currentDocType);
    });

    $('.js-menuDdlBtn-docType').html(currentDocType);
    $('.js-menuDdl-docType').html(docTypeLinks);
};


// Adds the options to the documentation type and version drop-down lists
var loadHeaderLists = function loadHeaderLists() {
    var currentDocVersion = getDocVersion(CONFIG.CONFLUENCE_SPACE_KEY);
    var currentDocType = getDocType(CONFIG.CONFLUENCE_SPACE_KEY);

    loadDocTypeHeaderList(currentDocVersion, currentDocType);
    loadDocVersionHeaderList(currentDocType, currentDocVersion);
};


// Closes the documentation type and version drop-down lists if the client clicks elsewhere
var closeHeaderDropDowns = function (event) {
    var buttonDocType = $(".js-menuDdlBtn-docType");
    var buttonVersion = $(".js-menuDdlBtn-version");
    var olderVersionsButton = $(".js-unsupported-versions-button");
    var olderVersionsList = $(".js-unsupported-versions-list");
    var devModelButton = $(".js-menuDdlBtn-devModel");
    var devModelList = $(".js-menuDdl-devModel");

    if (olderVersionsButton.is(event.target))
    {
        return;
    }

    if (!buttonDocType.is(event.target) && (buttonDocType.has(event.target).length === 0)) {
        $(".js-menuDdl-docType").removeClass("show");
        buttonDocType.removeClass("opened");
    }

    if (!buttonVersion.is(event.target) && (buttonVersion.has(event.target).length === 0)) {
        $(".js-menuDdl-version").removeClass("show");
        buttonVersion.removeClass("opened");
        olderVersionsList.removeClass("opened");
        olderVersionsList.removeClass("show");    
    }

    if (!devModelButton.is(event.target) && (devModelList.has(event.target).length === 0)) {
        devModelList.removeClass("show");
        devModelButton.removeClass("opened");
    }
};


$(document).ready(loadHeaderLists);
$(document).click(closeHeaderDropDowns);


// =========================== HEADER DevModel Switcher ========================
var isDevModelSwitcherSupported = function isDevModelSwitcherSupported() {
    var currentSpaceKey = CONFIG.CONFLUENCE_SPACE_KEY;

    // Only supported by whitelisted documentation versions - CONFIG.CONFLUENCE_DEVMODEL_VERSIONSWITCHER_WHITELIST
    if (!currentSpaceKey.toLowerCase().includes("api") && CONFIG.CONFLUENCE_DEVMODEL_VERSIONSWITCHER_WHITELIST.indexOf(getDocVersion(currentSpaceKey)) >= 0) {
        return true;
    }

    return false;
};


var getPageLabels = function () {
    var labels = $('[name="confluence-page-labels"]').attr('content');
    labels = labels.slice(1, -1);
    labels = labels.split(", ");

    return labels;
};


var setDevModelWebStorage = function () {
    if (isDevModelSwitcherSupported() && typeof (Storage) !== "undefined") {
        var currentLabels = getPageLabels();

        // Sets MVC mode for pages containing the 'mvc' label
        if (currentLabels.indexOf("mvc") >= 0) {
            localStorage.kenticoDocumentationMode = "mvc";
            return;
        }
        // Sets PE mode for pages containing the 'pe' label
        if (currentLabels.indexOf("pe") >= 0) {
            localStorage.kenticoDocumentationMode = "pe";
            return;
        }

        // Checks for the 'devModel' query string parameter, which can force the dev model for hybrid pages
        var queryStringParams = window.location.search;
        if (queryStringParams.indexOf("devModel=mvc") >= 0) {
            localStorage.kenticoDocumentationMode = "mvc";
            return;
        }
        if (queryStringParams.indexOf("devModel=pe") >= 0) {
            localStorage.kenticoDocumentationMode = "pe";
            return;
        }

        // Defaults to MVC if no web storage value is set
        if (!localStorage.kenticoDocumentationMode || localStorage.getItem("kenticoDocumentationMode") === null) {
            localStorage.kenticoDocumentationMode = "mvc";
        }
    }
    // Does nothing if web storage is disabled, endpoints automatically default to MVC
};


var getCurrentDevModel = function () {
    var currentlabels = getPageLabels();

    if (currentlabels.indexOf("mvc") >= 0) {
        return "mvc";
    }

    if (currentlabels.indexOf("pe") >= 0) {
        return "pe";
    }

    // Checks for the 'devModel' query string parameter, which can force the dev model for hybrid pages
    var queryStringParams = window.location.search;

    if (queryStringParams.indexOf("devModel=mvc") >= 0) {
        return "all|mvc";
    }
    if (queryStringParams.indexOf("devModel=pe") >= 0) {
        return "all|pe";
    }

    // Checks the persisting local storage for hybrid pages (MVC + PE)
    if (typeof (Storage) !== "undefined" && localStorage.kenticoDocumentationMode) {
        return "all|" + localStorage.kenticoDocumentationMode;
    }

    // Defaults to MVC if local storage is empty or disabled
    return "all|mvc";
};


// Translates the trimmed space key version to the ID used by the documentation help service
var translateToHelpServiceVersion = function (version) {
    return DOCUMENTATION_VERSIONS.find((item) => item.versionId == version).helpServiceVersion;
};


// Switches the dev model in the web storage
// Does NOT redirect (this is a helper function to be called before a redirect/refresh/link)
var switchDevModelStorage = function (targetModel) {
    if (typeof (Storage) !== "undefined") {
        localStorage.kenticoDocumentationMode = targetModel;
    }
};

// Displays/hides the documentation type selector drop-down list
var openCloseDevModelDdl = function () {
    $(".js-menuDdl-devModel").toggleClass("show");
    $(".js-menuDdlBtn-devModel").toggleClass("opened");
};

var devModelMap = {
    mvc: 'MVC',
    pe: 'Portal Engine',
};


var initAltDevModelLink = function () {
    // Ends the function for Confluence spaces that do not support the dev model switcher
    if (!isDevModelSwitcherSupported()) {
        return;
    }

    var currentModel = getCurrentDevModel();

    // Checks whether the page is available for all dev models and adjusts the currentModel value if that is the case
    var allDevModelPage = false;
    if (currentModel.indexOf("all|") === 0) {
        allDevModelPage = true;
        currentModel = currentModel.split("|")[1];
    }

    var altDevModel = (currentModel == "mvc") ? "pe" : "mvc";

    // Gets the active dev model element and adds the 'active' CSS class
    $(".js-" + currentModel + "-model-link").addClass("active");

    // Gets the non-active dev model element
    var altDevModelElement = $(".js-" + altDevModel + "-model-link");

    // Ends the function if the element is not present on the page ^^
    if (!altDevModelElement) {
        return;
    }

    $('.js-menuDdlBtn-devModel').html(devModelMap[currentModel]);

    // For "all dev model" pages, adjusts the alternative link to refresh the same page and switches the dev model
    if (allDevModelPage) {
        altDevModelElement.on("click", function () {
            switchDevModelStorage(altDevModel);
            // Special page reload if switching on the search results page
            var pathNameArray = window.location.pathname.split("/");
            if (pathNameArray[pathNameArray.length - 1] == "search") {
                // Reopens the search results page with the switched dev model
                kenticoThemeOpenSearchResultsPage();
            }
            else {
                // Removes the fragment from the page URL (it can otherwise prevent a full page reload if present)
                var devModelReloadUrl = window.location.href.replace(window.location.hash, "");
                devModelReloadUrl = devModelReloadUrl.replace("#", "");

                // Removes the ?devModel query string parameter which would interfere with the switch on all_model pages
                // Note: The current basic implementation also removes all parameters after 'devModel'
                devModelReloadUrl = devModelReloadUrl.split("?devModel")[0];

                // Reloads the page
                window.location.href = devModelReloadUrl;
            }
        });

        currentModelElement.on("click", function(e) {
            e.preventDefault();
            openCloseDevModelDdl();
        });

        return;
    }

    // For pages available in a specific dev model, attempts to get the identifier of the alternative page
    var altPageIdentifier = $("#dev-model-alt").attr("data-devmodel-alt");

    // Branches behavior depending on the existence of a page in the alternative dev model
    if (altPageIdentifier) {
        var currentDocVersion = getDocVersion(CONFIG.CONFLUENCE_SPACE_KEY);
        var helpServiceVersion = translateToHelpServiceVersion(currentDocVersion);

        var altPageUrl = CONFIG.HELPSERVICE_LINKMAPPER_ENDPOINT + helpServiceVersion + "&link=" + altPageIdentifier;

        // Adds "link" functionality when the alternative dev model element is clicked
        altDevModelElement.on("click", function () {
            // Switches the dev model (for cases where the alternative target is an "all dev model" page)
            switchDevModelStorage(altDevModel);
            window.location.href = altPageUrl;
        });
    } else {
        // Visually disables the dev model switcher
        $(".js-menuDdlBtn-devModel").prop("disabled", true).prop("title", "");

        // Displays a message informing that the page is not available in the other dev model
        var currentModelText = (currentModel == "mvc") ? "MVC" : "Portal Engine";
        var altModelText = (altDevModel == "mvc") ? "MVC" : "Portal Engine";
        var altModelHomeUrl = $('#ajs-context-path').attr('content') + "/" + CONFIG.CONFLUENCE_SPACE_KEY.toLowerCase() + "?devModel=" + altDevModel;
        var altModelHomeLink = '<a id="alt-model-home-link" href="' + altModelHomeUrl + '"' + '>' + altModelText + ' Home page</a>';
        $(".js-dev-model-unavailable-text").html("<p>This page is only available for the " + currentModelText + " development model.<br />You can switch to the " + altModelHomeLink + ".</p>");
    }
};


$(document).ready(setDevModelWebStorage);
$(document).ready(initAltDevModelLink);

// =========================== X13 Core/MVC dev framework switcher ========================

var setDevFrameworkButtons = function () {
    $(".js-dev-model-switch-core").click(function(){ coreFrameworkOnClick(); });
    $(".js-dev-model-switch-mvc").click(function(){ mvcFrameworkOnClick(); });
    $(".js-dev-model-switch-indicator").click(function(e) {
        if (localStorage.kenticoDocumentationFramework === "core") {
            mvcFrameworkOnClick()
        } else {
            coreFrameworkOnClick();
        }
    })

    $(".js-dev-model-switch-mvc, .js-dev-model-switch-core ").on('keyup', function(e) { 
        e.preventDefault();
        e.stopPropagation();

        // user has pressed space
        if (e.keyCode === 32){
            if (localStorage.kenticoDocumentationFramework === "core") {
                mvcFrameworkOnClick()
            } else {
                coreFrameworkOnClick();
            }
        }
    });
}

var setDevFrameworkCheckbox = function () {
    if (localStorage.kenticoDocumentationFramework === "mvc") {
        $(".js-dev-model-switch-mvc").attr("checked", true);
        $(".js-dev-model-switch").addClass("is-dev-model-mvc").removeClass("is-dev-model-core")
    } else if (localStorage.kenticoDocumentationFramework === "core") {
        $(".js-dev-model-switch-core").attr("checked", true);
        $(".js-dev-model-switch").addClass("is-dev-model-core").removeClass("is-dev-model-mvc")
    }
}

var setCorrectFramework = function (checkUrlParameters = false) {
    // Sets MVC as the default framework if framework is not set
    if (!localStorage.kenticoDocumentationFramework || localStorage.getItem("kenticoDocumentationFramework") === null) {
        localStorage.kenticoDocumentationFramework = "mvc";
    }
    
    // Forces a framework from the URL parameter if available
    if(checkUrlParameters) {
        const urlParams = new URLSearchParams(window.location.search);
        let devModelParameter = urlParams.get("devmodel");
        if(devModelParameter === "mvc" || devModelParameter === "core") {
            localStorage.kenticoDocumentationFramework = devModelParameter;
        }
    }
    
    // Sets the visibility of conditional content blocks
    if (localStorage.kenticoDocumentationFramework === "mvc") {
        $(".dev-model-core").css("display", "none");
        $(".dev-model-mvc").css("display", "block");
    }
    if (localStorage.kenticoDocumentationFramework === "core") {
        $(".dev-model-mvc").css("display", "none");
        $(".dev-model-core").css("display", "block");
    }
    
    setDevFrameworkCheckbox();
}

var setHoverTitles = function () {
    let text="Switch the displayed development model in the switcher under the page heading";
    $(".dev-model-core .codeContent").attr("title", text);
    $(".dev-model-mvc .codeContent").attr("title", text);
}

var coreFrameworkOnClick = function () {
    localStorage.kenticoDocumentationFramework = "core";
    setCorrectFramework();
}

var mvcFrameworkOnClick = function () {
    localStorage.kenticoDocumentationFramework = "mvc";
    setCorrectFramework();
}

var showDevFrameworkSwitcher = function () {
    $(".js-dev-model-switch").removeClass("is-hidden");
}

var setDevFrameworkSwitcher = function () {
    // Checks that conditional content is present on the current page
    if(($(".dev-model-core").length + $(".dev-model-mvc").length) > 0) {
        setCorrectFramework(true);
        setDevFrameworkButtons();
        setDevFrameworkCheckbox();
        showDevFrameworkSwitcher();
        setHoverTitles();
    }
}

$(document).ready(setDevFrameworkSwitcher);

// ============================ SCROLLING ADJUSTMENTS ============================

var initSidebar = function initSidebar() {
    // Sidebar page links are rendered
    if ($('.ht-nav-page-link').first() !== null) {
        // Current page link exists
        // Does not occur on homepages
        if ($('.ht-nav-page-link.current').length) {
            var $scrollableContent = $("div.ht-sidebar-content");
            var headerHeight = $('#ht-headerbar').outerHeight(true);
            var currentItemTop = $('.ht-nav-page-link.current')[0].getBoundingClientRect().top;

            if ($('div.ht-sidebar-content')[0].scrollTop === 0) {
                $scrollableContent.animate({
                    scrollTop: Math.round(currentItemTop - headerHeight - $scrollableContent.outerHeight() / 2.5)
                }, 0);
            }

            // Once scrolled, add CSS animation class
            $('#ht-sidebar').addClass('animate');
        }
        else {

            window.requestAnimationFrame(initSidebar);
        }
    }
};

window.requestAnimationFrame(initSidebar);


// ============================ CUSTOM SEARCH IMPLEMENTATION ============================

// Prepares a search request and redirects to the full search results page
var kenticoThemeOpenSearchResultsPage = function () {
    var searchQuery = $('.search-input').val();

    // Escapes forbidden characters
    searchQuery = encodeURIComponent(searchQuery);

    // Sets the max number of search results per page to 10
    searchQuery = searchQuery + '&max=10';

    // Determines whether label filtering based on the current dev model is allowed
    // True by default, false if the 'Show results for all dev models' checkbox exists (on the search results page) and is selected
    var showAllResultsCheckboxElem = document.querySelector("#check-show-all-search-results");
    var useDevModelFiltering = !(showAllResultsCheckboxElem && showAllResultsCheckboxElem.checked);

    // Calls the ViewPort search results navigation function
    if (window.SCROLL_WEBHELP && window.SCROLL_WEBHELP.search) {
        window.SCROLL_WEBHELP.search.navigateToSearchPage(searchQuery, useDevModelFiltering);

        // Closes the search suggestions drop-down
        var searchInputElementinput = $('#ht-search');
        searchInputElementinput.find('.ht-search-dropdown').removeClass('open');
        // Removes the hover class from items selected in the search drop-down
        var selectedSearchLinkElement = $(".ht-search-dropdown a.hover");
        selectedSearchLinkElement.removeClass("hover");
        $(document).unbind('keydown');
    }
};


// ============================ SEARCH BOX SUGGESTIONS ============================

// Toggles the search suggestion drop-down list on click
var toggleSearchSuggestions = function (event) {
    var searchInput = $("input.search-input");
    var searchDropdown = $(".ht-search-dropdown");
    var searchButton = $("#searchButton");
    var selectedSearchLinkElement = $(".ht-search-dropdown a.hover");

    // Removes the "open" class if the user clicked outside the search drop-down or form input
    if ((!searchInput.is(event.target) && searchInput.has(event.target).length === 0) &&
        (!searchDropdown.is(event.target) && searchDropdown.has(event.target).length === 0)
    ) {
        searchDropdown.removeClass("open");

        // Removes the hover class from items selected in the search drop-down
        selectedSearchLinkElement.removeClass("hover");

        // Collapses the small search box on smaller screens
        if ((!searchButton.is(event.target) && searchButton.has(event.target).length === 0) && window.innerWidth <= 800 && window.innerWidth > 499) {
            searchInput.removeClass("show");
        }
    }
    else {
        if ($(".ht-search-dropdown li.search-key").length) {
            searchDropdown.addClass("open");
        }
    }
};

$(document).click(toggleSearchSuggestions);


// ============================ BIG SEARCH AREA (HOME + SEARCH PAGES) ============================

// Increases the top padding of the main page content if the big search area is present
var setContentTopPadding = function () {
    var searchboxElement = $(".searchbox-area-behind").first();
    if (searchboxElement.length) {
        $(".ht-content").first().css("padding-top", searchboxElement.outerHeight(true) + "px");
    }
};


$(document).ready(setContentTopPadding);
$(window).resize(setContentTopPadding);


// ============================ FOOTER ============================

// Sets the footer width and position based on the main page content section
var setFooterWidth = function () {

    var viewWidth = document.documentElement.clientWidth;
    // var footerWidth = $(".ht-content").width();
    var footerWidth = $("#ht-wrap-container").width();
    var leftPosition = $("#ht-wrap-container").offset().left;
    var rightPadding = viewWidth - footerWidth - leftPosition;

    $("#ht-footer").css({
        "right": -rightPadding,
        "padding-right": rightPadding,
        "left": -leftPosition,
        "padding-left": leftPosition
    });
};

$(document).ready(setFooterWidth);
$(window).resize(setFooterWidth);

// http://stackoverflow.com/a/14901150
// // Checks element height change
function onElementHeightChange(elm, callback) {
    var lastHeight = elm.clientHeight, newHeight;
    (function run() {
        newHeight = elm.clientHeight;
        if (lastHeight != newHeight)
            callback();
        lastHeight = newHeight;

        if (elm.onElementHeightChangeTimer)
            clearTimeout(elm.onElementHeightChangeTimer);

        elm.onElementHeightChangeTimer = setTimeout(run, 200);
    })();
}

onElementHeightChange(document.body, setFooterWidth);


// ============================ CODE BLOCKS ============================
// Toggles code block content
$("span.expand-control").click(function () {
    var codeContent = $(this).parent().next();
    var expandControlText = $(this).find("span.expand-control-text");

    if (codeContent.hasClass("collapse")) {
        codeContent.removeClass("collapse");
        expandControlText.text("Collapse source");
    }
    else {
        codeContent.addClass("collapse");
        expandControlText.text("Expand source");
    }
});



/**
 * Checks if the user is signed-in and isn't typing in the search box.
 * @returns {string} the Confluence ID of the current page or 0
 */
var getPageIdIfEditingAllowed = function getPageIdIfEditingAllowed() {

    var length = $("#sp-viewport-control-opener").length;
    var searchboxFocused = $(".search-input").is(":focus");

    if (length != 0 && !searchboxFocused)
    {
        var pageId = $("body").attr("pageid");

        return pageId ? pageId : 0;
    }

    return 0;
};


/**
 *  Opens a link in the same/new tab based on the parameters
 * @param {string} url - The URL to open
 * @param {boolean} newTab - Specifies whether to open the URL in a new tab
 */
 function openLink(url, newTab) {
    if (newTab) {
        var win = window.open(url, "_blank");
        win.focus();
    } else {
        window.open(url, "_self");
    }
}


// ============================ EMPTY <p> ============================

// Hides paragraphs containing only whitespace
$('p').each(function () {
    if ($(this).text().trim() == '' && $(this).children().length == 0) {
        $(this).hide();
    }
});


// ============================ SHOW SEARCH TIPS ======================
var showHideSearchTips = function showHideSearchTips() {
    if ($("#search-tips").hasClass("show")) {
        hideFrontLayer();
    }
    else {
        showFrontLayer();
    }
};


var showFrontLayer = function showFrontLayer() {
    $("#search-tips").addClass("show");
    document.getElementById('search-tips-mask').style.visibility = 'visible';
    document.getElementById('search-tips').style.visibility = 'visible';
};


var hideFrontLayer = function hideFrontLayer() {
    document.getElementById('search-tips-mask').style.visibility = 'hidden';
    document.getElementById('search-tips').style.visibility = 'hidden';
    $("#search-tips").removeClass("show");
};

// ================================== Cookie Banner ==================================

var createCookie = function createCookie(name, value, days, domain) {
    var domain = "; domain=" + domain;
    var expires;

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    else expires = "";
    document.cookie = name + "=" + value + expires + "; path=/" + domain;
};


var eraseCookie = function eraseCookie(name) {
    createCookie(name, "", -1, "");
};


// Sets the shared cookie and hides the cookie banner
var consentWithCookieUsage = function consentWithCookieUsage() {
    $("#cookie-banner").addClass("hidden");
    // Use domain ".xperience.io" to share the cookie with xperience.io and all subdomains
    createCookie("xperience.cookielevelselection", true, 365, ".xperience.io");
};


var hideCookieConsentBanner = function hideCookieConsentBanner() {
    var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)xperience.cookielevelselection\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    if (cookieValue || !navigator.cookieEnabled) {
        $("#cookie-banner").addClass("hidden");
    }
};

// Sets the passed cookie level to the shared cookie and updates the consent to GA/GTM (called from the cookie banner after clicking a button)
var setCookieLevel = function setCookieLevel(level) {
    var level = level;

    if (level === "marketing") { // Shouldn't be needed
        level = 4;
    } else if (level === "analytical") {
        level = 3;
    } else if (level === "preference") { // Shouldn't be needed
        level = 2;
    } else { // === "necessary"
        level = 1;
    }

    consentWithCookieUsage();
    // Use domain ".xperience.io" to share the cookie with xperience.io and all subdomains
    createCookie("xperience.cookieconsentlevel", level, 365, ".xperience.io");

    // Send 'consent.update'
    if (level === 1) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'consent.update',
            'consent': {
            'functionality_storage': 'granted',
            'personalization_storage': 'denied',
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'security_storage': 'denied'
            }
        });
    } else if (level === 3) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'consent.update',
            'consent': {
            'functionality_storage': 'granted',
            'personalization_storage': 'granted',
            'analytics_storage': 'granted',
            'ad_storage': 'denied',
            'security_storage': 'denied'
            }
        });
    }

};


$(document).ready(function() {
    hideCookieConsentBanner();
});


// ================================== Heading anchor link clipboard ==================================

var copyHeadingLink = function copyHeadingLink(e) {
	var clickedIcon = $(e.target);
	
	// Builds the heading anchor link
	var anchorLink = window.location.origin + window.location.pathname + '#' + clickedIcon.parent().attr('id');
	
	if (navigator.clipboard === undefined) {
		Snackbar.show({text: 'An error occurred while copying the heading link to the clipboard', pos: 'top-right', showAction: false, customClass: 'box-general box-warning', duration: '3500', backgroundColor: '#FFEBEB', textColor:'#151515' });
	} else {
		navigator.clipboard.writeText(anchorLink)
			.then(() => {				
				Snackbar.show({text: 'Heading link copied', pos: 'top-right', showAction: false, customClass: 'box-general box-info', duration: '2500', backgroundColor: '#EEF3FC', textColor:'#151515' });
                clickedIcon.addClass('copied');
            })
			.catch(() => {
                Snackbar.show({text: 'An error occurred while copying the heading link to the clipboard', pos: 'top-right', showAction: false, customClass: 'box-general box-warning', duration: '3500', backgroundColor: '#FFEBEB', textColor:'#151515' });
            });
	}
};

// Resets the copy icon on mouseout
var copyIconMouseOut = function copyIconMouseOut(e) {
	var clickedIcon = $(e.target);
	if (clickedIcon.hasClass('copied')) {	
        clickedIcon.removeClass('copied');
    }
};

(function() {
	var copyHeadingLinkIcon = '<span title="Copy link to heading" class="heading-link-icon icon-chain" onclick="copyHeadingLink(event)" onmouseout="copyIconMouseOut(event)"></span>';
	
	// Selector for h2 and h3 headings in standard Confluence content (no section, full-width section, and 2/3 section content)
	var headingElements = '#main-content .sp-grid-60 h2, #main-content .sp-grid-100 h2, #main-content .sp-grid-60 h3, #main-content .sp-grid-100 h3';
	
	// Filters out headings in box macros and headings containing links
	// Appends the "Copy heading link" icon to the heading content
	$(headingElements).not('div.box-general h2, div.box-general h3, h2:has(a), h3:has(a)').append(copyHeadingLinkIcon);
})(); 
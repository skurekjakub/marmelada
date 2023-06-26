// ============================ "CONFIG" ===============================================

// Add latest documentation versions to the front
const DOCUMENTATION_VERSIONS = [
    { versionId: "xp",   versionText: "Xperience by Kentico",   helpServiceVersion: "xp" },
	{ versionId: "13",   versionText: "Xperience 13",   helpServiceVersion: "13.0" },
    { versionId: "12sp", versionText: "Kentico 12 SP",  helpServiceVersion: "12.0sp" },
    { versionId: "12",   versionText: "Kentico 12",     helpServiceVersion: "12.0" },
    { versionId: "11",   versionText: "Kentico 11",     helpServiceVersion: "11.0" },
    { versionId: "10",   versionText: "Kentico 10",     helpServiceVersion: "10.0" },
    { versionId: "9",    versionText: "Kentico 9",      helpServiceVersion: "9.0" },
    { versionId: "82",   versionText: "Kentico 8.2",    helpServiceVersion: "8.2" },
    { versionId: "81",   versionText: "Kentico 8.1",    helpServiceVersion: "8.1" },
                                                        // as configured in the HelpService module
    { versionId: "8",    versionText: "Kentico 8",      helpServiceVersion: "8" }
];


const CONFIG = {
    DEV_DOCUMENTATION_VERSION_ID: "none",
    /** The newest unsupported Kentico version ID */
    NEWEST_UNSUPPORTED_VERSION_ID: "11",

    /** The base URL of the Confluence instance */
    BASE_URL: window.location.origin,
    /** The current space key */
    CONFLUENCE_SPACE_KEY: $('[name="confluence-space-key"]').attr('content'),
    /** The Confluence page identifier */
    CONFLUENCE_PAGE_ID: $("body").attr("pageid"),
    CONFLUENCE_DEVMODEL_VERSIONSWITCHER_WHITELIST: ["12", "12sp"],
		
	/** The specified version is redirected to the "root" domain without a viewport URL path */
	DOC_ROOT_URL_SPACE_KEY: "13",
		
	/** Contains versionIds with the old "k prefix" and API example pattern for space keys (before Xperience 13) */
	OBSOLETE_SPACE_KEY_FORMAT_VERSIONS: ["8", "81", "82", "9", "10", "11", "12", "12sp"],

    HELPSERVICE_URLID_ENDPOINT: "https://devnet.kentico.com/CMSPages/DocLinkUrlId.ashx?tinyid=",
    HELPSERVICE_LISTALTVERSIONLINKS_ENDPOINT: "https://devnet.kentico.com/CMSPages/DocLinkListing.ashx?versionLink=",
    HELPSERVICE_LINKMAPPER_ENDPOINT: "https://devnet.kentico.com/CMSPages/DocLinkMapper.ashx?version=", 
	
	/** URLs of the Xperience 13 and XP special pages that are linked when switching to a non-existing page from an older doc version
        Does not use the page's TinyId because that causes a redirect -- loss of query string parameters (would need a change in Confluence to change this behavior) -- see the usage of this setting*/
	XPERIENCE13_MISSING_PAGES_URL: "https://docs.xperience.io/release-notes-xperience-13/missing-documentation-pages",
	XP_MISSING_PAGES_URL: "https://docs.xperience.io/xp/xperience-changelog/missing-documentation-pages"
};

const THEME_CONFIG = {
    KENTICO_SUPPORT_LINK: "https://devnet.kentico.com/support",
    KENTICO_QA_LINK: "https://devnet.kentico.com/questions-answers"
}
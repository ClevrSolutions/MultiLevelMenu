define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/_base/event",
    "dijit/form/TextBox",
    "dojo/dom-geometry",
    "dojo/window",
    "dojo/query",
    "mxui/dom",
    "dojo/text!MultiLevelMenu/widget/ui/MultiLevelMenu_button.html",
    "dojo/text!MultiLevelMenu/widget/ui/MultiLevelMenu_splitButton.html",
    "MultiLevelMenu/widget/MenuData"
], function (declare, _WidgetBase, _TemplatedMixin, lang, domClass, domStyle, domConstruct, domAttr, event, TextBox, domGeom, win, query, dom, noMicroflowTemplate, microflowTemplate, menuData) {
    //"use strict";  cannot use strict mode due to buildRending: this.inherited(arguments);
    try {
    return declare("MultiLevelMenu.widget.MultiLevelMenu", [ _WidgetBase, _TemplatedMixin ], {
        
        templateString: noMicroflowTemplate,
        templateString: microflowTemplate,
            // Appearance
            captionText: "",
            noMenuItemsCaption: "",
            icon: "",
            readonly: false,
            readonlyConditional: "",
            emptyCaptionText: "",
            clearText: "",
            loadingText: "",
            buttonStyle: "default",

            // behaviour
            changeMicroflow: "",
            clickMicroflow: "",
            maxMenuItems: 1000,
            maxMicroflow: "",
            prefetch: "onclickOnce",
            parentSelectable: "true",
            searchEnabled: false,

            //data source   
            entitynote: "",
            reference: "",
            displayFormat: "",

            //menu level
            recursive: false,
            menuLevels: [], //{refDsMicroflow}
            refSourceEntity: "",
            menuReference: "",
            labelAttribute: "",
            displayLabel: "",

            //selectable objects
            entityConstraint: "",
            dsMicroflow: "",
            class: "",

        //Caches
        context: null,
        mlMenuButton: null,
        readOnlyBool: false,
        isInactive: false,
        isDisabled: false,
        selectEntity: "",
        targetReference: "",
        counterMenuItem: 0,
        errorMenu: false,
        shown: false,
        baseClass: "multiLevelMenu",
        dataLoaded: false,
        loadingMenuNode: null,
        noMenuItemsNode: null,
        menuNode: null,
        dataSource: null,
        wrapperNode: null,
        searchInput: null,
        noResultNode: null,

        //handles
        handler: null,
        handlerReference: null,
        handlerValidation: null,
        scrollHandle: null,
        resizeHandle: null,
        scrollTimer: null,
        resizeTimer: null,
        searchTimer: null,

        // template  variables
        domNode: null,
        label: null,
        btnGroup: null,
        imageNode: null,
        dropDownButton: null,
        button: null,
        validationDiv: null,

        // Author: Andries Smit
        // Organisation: Flock of Birds
        // Version 2.2
        // Date 26 April 2015
        // 
        // KNOW ISSUES :
        // If menu has submenus no scrollbar will be shown.
        // Auto close menu with timer on leave does not work.
        // Overflow of menu in .mx-layoutcontainer-wrapper can be shown by scrolling/resizing. If the scroll bar is in another element the menu does not move.
        // 
        // TODO: 
        // Make us dojo template attach event
        // TODO loop trough each level could be more efficient
        //                
        // OPTIONAL:
        // different buttons: normal, split button, input,   
        // Add key escape event to close menu?  
        // Split into 2 difference widgets : normal and recursive  
        // Navigation header in menu with entity name  <li class="nav-header">Organisation</li>
        // Menu does not close, when other menu is opened, on leave menu close
        // 
        // ADDED drop up and left based on screen position?  http://www.bootply.com/92442  
        // ADDED test with large set of data
        // ADDED make max menu size input parameter
        // ADDED clear with list header and close button <li class="nav-header">List header<button type="button" class="close" data-dismiss="modal" aria-hidden="true">x</button></li>
        // ADDED When max result, have a MF to be clicked to open an alternative.
        // ADDED render clear button as anchor. <a tabindex="-1" href="#">(clear cat)<button type="button" class="close">x</button></a> //css a.clear{ padding-right: 8px};
        // ADDED add divider above clear button  <li role="presentation" class="divider"></li>
        // ADDED make use of dojo template
        // ADDED disabled button looks strange
        // ADDED Bootstrap 3 menu should have presentation role <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Action</a></li>
        // ADDED Lazy Loading
        // ADDED add mf for split button
        // ADDED open submenu onclick too, make it mobile accessible.
        // ADDED close open submenus on hover clear button.
        // ADDED close open submenus when hover over items that have no sub menu, while siblings have
        // FIXED Validate recursive menu does not work.
        // ADDED Add loading menu to non recursive menu
        // ADDED not Show empty menu in on maxMf is triggered in normal menu
        // ADDED Add Schema to retrieve limited amount of data
        // ADDED Recursive child retrieve in 2 time instead of (n)        
        // ADDED in overflow menu bottom of page when still not at end of page
        // FIXED Recursive Menu, with empty data keep showing 'loading'
        // ADDED validation message should not show in error menu
        // FIXED on click position changes, sometime not placed on right spot, page width still extends
        // ADDED Have micro flows as data source 
        // ADDED Empty menu caption.
        // ADDED If button click mf render as Split Button else as normal Button
        // ADDED Split widget into data source and widget file
        // ADDED Timer to close menu on leave
        // FIXED Inline-block button and menu button (Will wrap when with is to long.)
        // ADDED Moved menu to div in body, so it can  overlap pop ups and control bars (thanks to Joost Stapersma)
        // ADDED Scroll in sub menu (that does not have a sub menu)
        // ADDED Filter Search options to limit the list.
        // ADDED Default caption in the xml for translatable strings.
        // FIXED Destroy of menu wrapper, Not destroying the wrapper keeps the menu visible after closing a popup with an open menu.
        // FIXED AMD loading of all dojo modules. (fixes loading issue on MX5.15)

        buildRendering: function () {
            // select a templated based on widget settings
            if (this.clickMicroflow === "")
                this.noMicroflowTemplate
            else
                this.microflowTemplate
            this.inherited(arguments);
        },

        postCreate: function () {
            dom.addCss("widgets/MultiLevelMenu/widget/ui/MulitLevelMenu.css");
            // not shared objects
            this.context = null;
            this.mlMenuButton = null;
            this.handler = null;
            this.handlerReference = null;
            this.handlerValidation = null;
            this.loadingMenuNode = null;
            this.noMenuItemsNode = null;
            this.menuNode = null;
            this.dataSource = null;
            this.scrollHandle = null;
            this.resizeHandle = null;
            this.scrollTimer = null,
                this.resizeTimer = null,
                this.searchInput = null,

                this.selectEntity = this.reference.split("/")[1];
            this.targetReference = this.reference.split("/")[0];
            this.dataSource = new menuData({
                "menuLevels": this.menuLevels,
                "maxMenuItems": this.maxMenuItems,
                "selectEntity": this.selectEntity,
                "entityConstraint": this.entityConstraint,
                "context": this.context,
                "dsMicroflow": this.dsMicroflow,
                "displayLabel": this.displayLabel,
                "menuWidget": this,
                "prefetch": this.prefetch,
                "recursive": this.recursive
            });

            //split config reference into entity and reference, for easy access
            for (var i = 0; i < this.menuLevels.length; i++) {
                var rs = this.menuLevels[i].menuReference.split("/");
                this.menuLevels[i].reference = rs[0];
                this.menuLevels[i].entity = rs[1];
            }

            this.renderHtml();
            this.validateConfig();

            // this.initContext();
            // this.actLoaded();
        },

        onSubMenuEnter: function (evt) {
            // open sub menu item, calculate position (function was removed from bootstrap
            evt.preventDefault();
            evt.stopPropagation();

            var menu = evt.target.parentNode.parentNode;
            query("*", menu).removeClass('open'); //close others
            var ww = window.innerWidth; // store windows width before opening.
            domClass.add(evt.target.parentNode, 'open');
            var menupos = domGeom.position(evt.target.parentNode);
            var subMenu = query("ul", evt.target.parentNode)[0];
            var subMenupos = domGeom.position(subMenu);

            if ((subMenupos.x + subMenupos.w) + 30 > ww) {
                if (menupos.x - subMenupos.w > 0)
                domStyle.set(subMenu, "left", -subMenupos.w + "px");
                else
                domStyle.set(subMenu, "left", -menupos.x + 15 + "px");
            }

            domStyle.set(subMenu, "top", "0px"); //reset top

            var winh = win.getBox().h;
            if (winh < (subMenupos.y + subMenupos.h)) {
                if (winh > (subMenupos.h + 10))
                domStyle.set(subMenu, "top", winh - (subMenupos.y + subMenupos.h) - 10 + "px");
                else
                domStyle.set(subMenu, "top", -winh + "px");
            }
        },

        validateConfig: function () {
            // Validate the configuration of the widget made in the modeller 
            if (this.parentSelectable && this.recursive === false){
                console.warn("Mulitlevel Menu; setting Parent Selectable can only be used in combination with the recursive menu");
                this.parentSelectable = false; // need to set to false for search function
            }
            // if (dojo.version.major === 4) {
            //     this.showValidationMessage("This widget will not work in Mendix 4");
            //     throw "Mendix 5 widget in Mendix 4";
            // }
            if (this.recursive === true && this.menuLevels.length > 1) {
                this.showValidationMessage("Configuration Error " + this.id + ": A recursive menu can only have one level");
                return false;
            }
            if (this.menuLevels[0].refSourceEntity !== this.selectEntity) {
                this.showValidationMessage("Configuration Error " + this.id + ": The first Menu level " + this.menuLevels[0].refSourceEntity + " should match the entity type of the data source " + this.targetReference);
                return false;
            }
            for (var i = 0; i < this.menuLevels.length; i++) {
                if (i > 0) {
                    if (this.menuLevels[i].refSourceEntity !== this.menuLevels[i - 1].entity) {
                        this.showValidationMessage("Configuration Error " + this.id + ": The Menu level " + (i + 1) + " are is not matching the previous level. the entity " + this.menuLevels[i].refSourceEntity + " should be equal to " + this.menuLevels[i - 1].entity);
                        return false;
                    }
                }
            }
            return true;
        },

        showValidationMessage: function (msg) {
            // Show validation message under the menu
            domStyle.set(this.validationDiv, "display", "block");
            this.validationDiv.innerHTML = msg;
            // mx add also error parent node ?
        },

        appendMenu: function (menuData) {
            // add the menus to the button and append clear, will be called by data source, when completed            
            var menu = this.getMenu(menuData);

            var $ = mxui.dom.create;
            if( this.searchEnabled ){
                this.searchInput = new TextBox({
                    name: "menuSearch",
                    class: "searchInput",
                    onClick: function(e){ event.stop(e);},
                    onKeyUp: lang.hitch(this,function(){
                        //timer on update for better performance
                        if(this.scrollTimer)
                            clearTimeout(this.searchTimer);
                        this.searchTimer = setTimeout(lang.hitch(this, this.filterList, menu), 50);
                    })
                });

                var filter = $("form", {"class" : "filterform"}, this.searchInput.domNode);
                domConstruct.place(filter, menu, "first");
                this.noResultNode = $("li", {"class" : "no-result hidden", "role": "presentation"}, this.noResultCaption);
                menu.appendChild( this.noResultNode );
            }

            if (this.clearText !== "") {
                var clearButton = $("a", {
                    tabindex: "-1",
                    href: "#"
                }, this.clearText, $("button", {
                    type: "button",
                    class: "close"
                }, "x"));

                this.connect(clearButton, 'onmouseenter', lang.hitch(this, this.closeSubMenus, this.btnGroup));
                this.connect(clearButton, "onclick", lang.hitch(this, this.onClearSelect));

                menu.appendChild($("li", {
                    class: "divider"
                }));
                var listItem = $("li", {
                    class: "nav-header clearSelection"
                }, clearButton);
                menu.appendChild(listItem);
            }

            this.menuNode = menu;
            this.dataLoaded = true;
            if (this.prefetch === "onclickOnce" || this.prefetch === "onclick")
            domConstruct.destroy(this.loadingMenuNode);

            // Create wrapper node containing the ul with the menu data
            if (this.wrapperNode)
            domConstruct.destroy(this.wrapperNode);

            this.wrapperNode= $("div", {
                class: "mlMenuDataContainer"
            });
            this.wrapperNode.appendChild(menu);

            //calculate wrapper node position and append to body
            document.body.appendChild(this.wrapperNode);
            this.positionDropdown(this.wrapperNode);
            this.searchInput && this.searchInput.focus();
        },

        filterList: function(menu){
            this.closeSubMenus(menu);
            var value = this.searchInput.get("value").toLowerCase().replace(/['"]+/g, '');
            if(value){
                // find all (data) items that do not match the value, exclude the standard menu items, and hide them.
                var cssFilter = 'li:not(.hidden):not(.no-result):not(.divider):not(.clearSelection) > a:not(a[search-data*="' + value + '"])';
                // filter only on submenus when parents are selectable
                if(!this.parentSelectable) { cssFilter += ':not(.subMenu)'; }
                var list = query(cssFilter, menu);
                list.forEach(function(listItem) {
                    listItem.parentElement.classList.add("hidden");
                });
                // find all items that match and show them (unhide)
                cssFilter = 'li.hidden > a[search-data*="' + value + '"]';
                list = query(cssFilter, menu);
                list.forEach(function(listItem) {
                    listItem.parentElement.classList.remove("hidden");
                });
                var parentSelectable = this.parentSelectable;
                for(var i=0; i < 5 ; i++){
                    // TODO loop trough each level could be more efficient
                    // Check for each submenu if it should be shown
                    list = query(".dropdown-submenu", menu).forEach(function(subMenuNode){
                        // find submenu has item that are not hidden.
                        var subItemsVis = query("li:not(.hidden)",subMenuNode);
                        if(subItemsVis.length > 0){ // has items, so show
                            domClass.remove(subMenuNode, "hidden");
                            parentSelectable && domClass.remove(subMenuNode, "hidden-submenu");
                    } else {
                        if(parentSelectable){ 
                                // this is sub menu selectable but has no sub menu items, so hide only the sub menu
                                domClass.add(subMenuNode, "hidden-submenu");
                            } else {
                                // sub menu is not selectable and has not children, so should be hidden
                                domClass.add(subMenuNode, "hidden");
                            }
                        }
                    });
                }
                // find if there are still some items left after the search
                list = query(">li:not(.hidden):not(.no-result):not(.divider):not(.clearSelection)",menu);

                if(list.length === 0)
                    domClass.remove(this.noResultNode, "hidden");
                else
                    domClass.add(this.noResultNode, "hidden");
            } else {
                // no search, so remove all classes to make them hidden. 
                query("li.hidden", menu).removeClass("hidden");
                query("li.hidden-submenu", menu).removeClass("hidden-submenu");
                domClass.add(this.noResultNode, "hidden");
            }
        },

        positionDropdown: function (node){            
            if(this.shown === true){
                if(!this.scrollHandle){
                    var panel = query(this.domNode)[0].closest(".mx-layoutcontainer-wrapper");
                    if(panel.length > 0){
                        this.scrollHandle = on(panel, "scroll", lang.hitch(this, function(){
                            //timer on update for better performance
                            if(this.scrollTimer)
                                clearTimeout(this.scrollTimer);
                            this.scrollTimer = setTimeout(lang.hitch(this, this.positionDropdown, this.wrapperNode), 50);

                        } ));
                    }
                }
                if(!this.resizeHandle){
                    var panel = query(this.domNode)[0].closest(".mx-layoutcontainer-wrapper");
                    if(panel.length > 0){
                        this.resizeHandle = aspect.after(this.mxform, "resize", lang.hitch(this, function(){
                            if(this.resizeTimer)
                                clearTimeout(this.resizeTimer);
                            this.resizeTimer = setTimeout(lang.hitch(this, this.positionDropdown, this.wrapperNode), 50);                            
                        } ));    
                    }
                }                
            }else {
                this.scrollHandle && this.scrollHandle.remove();
                this.resizeHandle && this.resizeHandle.remove();            
            }
            if (node && this.shown === true) {
                domClass.add(node, "open");
            }
            if(this.btnGroup){
                //positions the wrapper node relative to button
                var btnPos = domGeom.position(this.btnGroup);

                domStyle.set(node, "left", btnPos.x + "px");
                domStyle.set(node, "top", (btnPos.y + btnPos.h) + "px");
                if(node.firstChild){
                    var menupos = domGeom.position(node.firstChild), winh = win.getBox().h;
                    if(this.elementInView(this.btnGroup)){
                        if(winh < (menupos.y + menupos.h)){
                            domStyle.set(node, "left", btnPos.x + 10 + "px");
                            if (winh > (menupos.h +10))
                            domStyle.set(node, "top", (winh - menupos.h -20) + "px");
                            else
                            domStyle.set(node, "top", 0 + "px");
                        }
                    } else {
                        if(winh < (menupos.y + menupos.h)) {
                            domStyle.set(node, "left", btnPos.x + 10 + "px");
                            domStyle.set(node, "top", (btnPos.y - menupos.h) + "px");
                        }
                    }
                }
            }
        },

        closeSubMenus: function (menu) {
            //close subMenus of main menu.
            query("*", menu).removeClass('open');
        },

        getMenu: function (menuData) {
            // render the bootstrap drop down menus
            var $ = mxui.dom.create;

            var menu = $("ul", {
                class: "dropdown-menu",
                role: "menu"
            });
            var hasSubmenu = false;
            for (var i = 0; i < menuData.length; i++) {
                if (menuData[i].children !== null) {
                    hasSubmenu = true;
                    var subMenu = this.getMenu(menuData[i].children);

                    var subLink = $("a", {
                        tabindex: "-1",
                        href: "#",
                        mxGUID: menuData[i].guid,
                        class: "subMenu",
                        "search-data" : menuData[i].label.toLowerCase().replace(/['"]+/g, '')
                    });
                    mxui.dom.html(subLink, menuData[i].label);

                    this.connect(subLink, "onclick", lang.hitch(this, this.onSubMenuEnter));
                    this.connect(subLink, 'onmouseenter', lang.hitch(this, this.onSubMenuEnter));
                    if(this.parentSelectable){
                        this.connect(subLink, "ondblclick", lang.hitch(this, this.onItemSelect));
                        this.connect(subLink, "onclick", lang.hitch(this, function(link, e){
                            if (domClass.contains(link.parentNode, "hidden-submenu")){
                                // in search mode the parent can be selected with a single click.
                                this.onItemSelect(e);
                                event.stop(e);
                            }
                        }, subLink));
                    }
                    var listItem = $("li", {
                        role: "presentation",
                        class: "dropdown-submenu"
                    }, subLink, subMenu);

                    menu.appendChild(listItem);

                } else {
                    var subLink = $("a", {
                        "href": "#",
                        "mxGUID": menuData[i].guid,
                        "search-data" : menuData[i].label.toLowerCase().replace(/['"]+/g, '')
                    });
                    mxui.dom.html(subLink, menuData[i].label);
                    var listItem = $("li", {
                        role: "presentation"
                    }, subLink);
                    this.connect(subLink, 'onmouseenter', lang.hitch(this, this.closeSubMenus, menu));
                    this.connect(subLink, "onclick", lang.hitch(this, this.onItemSelect));
                    menu.appendChild(listItem);
                }
            }
            if( ! hasSubmenu ){
                domClass.add(menu, "scrollable-menu");
            }
            if (menuData.length === 0 && this.noMenuItemsCaption !== "") {
                menu.appendChild(this.noMenuItemsMenu());
            }
            return menu;
        },

        setLoadingMenu: function () {
            // create temporary loading menu for lazy loading 
            if (this.loadingMenuNode)
            domConstruct.destroy(this.loadingMenuNode);

            var $ = mxui.dom.create;

            var node = $("ul", {
                class: "dropdown-menu",
                role: "menu"
            },
                $("li", {
                    class: "dropdown-header"
                }, this.loadingText));
            this.loadingMenuNode = node;
            this.btnGroup.appendChild(node);
        },

        noMenuItemsMenu: function () {
            // create temporary loading menu for lazy loading 
            var $ = mxui.dom.create;

            return $("li", {
                class: "dropdown-header"
            }, this.noMenuItemsCaption);
        },

        checkMenuSize: function () {
            // limit the menu size, will be called by the data source.
            this.counterMenuItem++;
            if (this.counterMenuItem >= this.maxMenuItems && this.maxMicroflow) {
                if (this.prefetch === "onclickOnce" || this.prefetch === "onclick")
                    this.execution(this.maxMicroflow);
                this.loadingMenuNode && domConstruct.destroy(this.loadingMenuNode);

                return true;
            }
            if (this.counterMenuItem >= this.maxMenuItems && !this.maxMicroflow) {
                this.showValidationMessage("Error loading menu: to many items to display");
                this.errorMenu = true;
                if (this.loadingMenuNode)
                domConstruct.destroy(this.loadingMenuNode);
                if(this.isOpen()) this.close();
                return true;
            }
            return false;
        },

        execution: function (mf) {
            // execute a MF
            if (mf) {
                mx.data.action({
                    params: {
                        actionname: mf,
                        applyto: "selection",
                        guids: [this.context.getGuid()]
                    },
                    store: {
                        caller: this
                    },
                    callback: function (obj) {},
                    error: function (error) {
                        console.error("Error in execution: " + error.description);
                    }
                });
            }
        },

        // Mendix function.is this ever used?
        _setDisabledAttr: function (value) {
            this.isDisabled = !!value;
        },

        onItemSelect: function (evt) {
            // a menu item selection handler
            var mxGUID = domAttr.get(evt.target, "mxGUID");

            mxGUID && this.context.addReference(this.targetReference, mxGUID);
            this.updateButtonLabel();
            this.close();

            this.execution(this.changeMicroflow);
            if (evt) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        },

        onClearSelect: function (evt) {
            // clear data selection in Mx object and label
            this.context.set(this.targetReference, "");

            this.updateButtonLabel();
            this.close();
            this.execution(this.changeMicroflow);
            if (evt) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        },

        renderHtml: function () {
            // connect events and set initial values
            if (this.icon) {
                this.imageNode.src = this.icon;
            } else {
                this.imageNode.style.display = "none";
            }
            mxui.dom.html(this.label, "Button loading");

            this.connect(this.dropDownButton, "onclick", lang.hitch(this, this.toggle));
            this.button && this.connect(this.button, "onclick", lang.hitch(this, this.execution, this.clickMicroflow));
            this.connect(document, "click", lang.hitch(this, this.close));
        },

        toggle: function (e) {
            // toggles the display of the dropdown or call MF if max menu items exceeded
            if (this.domIsDisabled()) {
                return false;
            }
            if (this.counterMenuItem < this.maxMenuItems || this.prefetch === "onclick") {
                this.isOpen() ? this.close() : this.open();
            } else {
                this.execution(this.maxMicroflow);
            }
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
        },

        open: function () {
            // shows the dropdown. Hides any other displayed dropdowns on the page.
            if (this.domIsDisabled()) {
                return false;
            }
            this.isOpen() || domClass.add(this.btnGroup, "open");
            if (this.prefetch === "onclickOnce" && !this.dataLoaded){
                this.setLoadingMenu();
                this.dataSource.loadData();
            }
            if (this.prefetch === "onclick") {
                this.counterMenuItem = 0;
                if (this.validationDiv)
                    domStyle.set(this.validationDiv, "display", "none");
                this.menuNode && domConstruct.destroy(this.menuNode);
                this.setLoadingMenu();
                this.dataSource.loadData();
            }

            this.shown = true;
            if (this.wrapperNode) {
                // TODO close time out does not work anymore
                this.stayOpenHandler = this.connect(this.domNode, "onmouseenter", lang.hitch(this, function(){
                    clearTimeout(this.timer);
                }));
                this.closeHandler = this.connect(this.wrapperNode.firstChild, "onblur", lang.hitch(this, function(){
                    this.timer = setTimeout(lang.hitch(this,function(){
                        this.disconnect(this.closeHandler); 
                        this.disconnect(this.stayOpenHandler); 
                        this.close();}),1000);
                }));
                this.positionDropdown(this.wrapperNode);
            }    
            this.searchInput && this.searchInput.focus();
        },
        
        elementInView : function(el){
            var rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
            );
        },

        close: function () {
            // hides the dropdown.
            if (this.domIsDisabled()) {
                return false;
            }
            if(this.isOpen()){
                query("*", this.domNode).removeClass('open');
                if(this.wrapperNode){
                    domClass.remove(this.wrapperNode, 'open');
                    query("*", this.wrapperNode).removeClass('open');
                }
            }
            this.shown = false;
        },

        domIsDisabled: function () {
            // returns whether the dropdown is currently disabled.
            return domClass.contains(this.dropDownButton, "disabled");
        },

        isOpen: function () {
            // returns whether the dropdown is currently visible.
            return this.shown;
        },

        updateButtonLabel: function () {
            // get the data of the new button label
            if (this.context.getReference(this.targetReference) !== "") {
                mx.data.get({
                    guid: this.context.getReference(this.targetReference),
                    count: true,
                    callback: lang.hitch(this, this.callBackUpdateButtonLabel),
                    error: function (error) {
                        console.error("Error in updateButtonLabel: " + error.description);
                    }
                });
            } else {
                this.callBackUpdateButtonLabel(null);
            }
        },

        callBackUpdateButtonLabel: function (mxObject) {
            // update the button label, enable, error message
            if (this._beingDestroyed || this._destroyed) //need check, bug mendix will do a second refresh resulting destroyed but still active instance
                return;
            var object = mxObject instanceof Array ? mxObject[0] : mxObject;
            var value = "&nbsp";
            if (object && this.displayFormat !== "") {
                value = object.get(this.displayFormat);
            }
            var currentLabel = this.label.innerHTML;
            var newLabel = this.captionText + value;
            if (value === "&nbsp")
                newLabel = this.captionText + this.emptyCaptionText;
            if (this.displayFormat !== "") {
                if (newLabel !== currentLabel)
                    mxui.dom.html(this.label, newLabel);
            } else {
                if (this.captionText) {
                    mxui.dom.html(this.label, this.captionText);
                } else {
                    mxui.dom.html(this.label, "&nbsp;");
                }
            }
            // this.readOnlyBool = true;
            var disableCondition = false;
            if (this.context) {
                this.readOnlyBool = this.context.isReadonlyAttr(this.targetReference);
                if (this.readonly === "conditional") {
                    disableCondition = !this.context.get(this.readonlyConditional);
                }
            }

            // if (this.readOnlyBool === true || this.readonly === "true" || this.isDisabled === true || disableCondition === true || !this.context)
                // this.isInactive = true;
            // else
                this.isInactive = false;
            var disabled = domClass.contains(this.dropDownButton, "disabled"); //TODO us function isDomDisabled

            if (!disabled && this.isInactive) {
                this.button && domClass.add(this.button, "disabled");
                domClass.add(this.dropDownButton, "disabled");
            } else if (disabled && !this.isInactive) {
                this.button && domClass.remove(this.button, "disabled");
                domClass.remove(this.dropDownButton, "disabled");
            }

            if (this.validationDiv && !this.errorMenu)
                domStyle.set(this.validationDiv, "display", "none");
        },

        validationUpdate: function (validations) {
            // On validation error show feedback
            for (var i = 0; i < validations.length; i++) {
                var fields = validations[i].getFields();
                for (var x = 0; x < fields.length; x++) {
                    var field = fields[x];
                    var name = field.name;
                    var reason = field.reason;
                    if (name === this.targetReference && !this.errorMenu) {
                        validations[i].removeAttribute(this.targetReference);
                        this.showValidationMessage(reason);
                    }
                }
            }
        },

        applyContext: function (context, callback) {
            // apply context of the object, connect with handlers and set label value
            var trackId = context && context.getTrackId();
            if (trackId) {
                mx.data.get({
                    guid: trackId,
                    error: function () {
                        console.log("Retrieving context object failed.");
                    },
                    callback: lang.hitch(this, function (context) {
                        this.context = context;
                        this.dataSource.context = context;

                        var valid = this.validateConfig();
                        if (valid === true && this.prefetch === "onload") {
                            this.dataSource.loadData();
                        }
                        this.updateButtonLabel();
                        this.handler = mx.data.subscribe({
                            guid: context.getGuid(),
                            callback: lang.hitch(this, this.updateButtonLabel)
                        });
                        this.handlerReference = mx.data.subscribe({
                            guid: context.getGuid(),
                            attr: this.targetReference,
                            callback: lang.hitch(this, this.updateButtonLabel)
                        });
                        this.handlerValidation = mx.data.subscribe({
                            guid: context.getGuid(),
                            val: true,
                            callback: lang.hitch(this, this.validationUpdate)
                        });
                    })
                });

            } else {
                this.context = null;
                this.dataSource.context = null;

                this.callBackUpdateButtonLabel(null);
            }
            callback && callback();
        },

        uninitialize: function () {
            // destroy handlers and generated dom
            mx.data.unsubscribe(this.handler);
            mx.data.unsubscribe(this.handlerValidation);
            mx.data.unsubscribe(this.handlerReference);
            this.domNode && domConstruct.destroy(this.domNode);
            this.wrapperNode && domConstruct.destroy(this.wrapperNode);
            console.debug(this.id + ".uninitialize");
        }
    });
} catch(e) {console.log(e)}
});

require([ "MultiLevelMenu/widget/MultiLevelMenu" ]);

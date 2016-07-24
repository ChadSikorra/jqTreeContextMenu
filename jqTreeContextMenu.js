(function ($) {
    if (!$.fn.tree) {
        throw "Error jqTree is not loaded.";
    }

    $.fn.jqTreeContextMenu = function (options) {
        var defaults = {
            menuFadeDuration: 250,
            selectClickedNode: true,
            onContextMenuItem: null
        };
        var settings = $.extend({}, defaults, options);
        var $el = this;
        var $menuEl;

        // Check if useContextMenu option is set
        var jqTree = $el.data('simple_widget_tree');
        if(!jqTree || !jqTree.options.useContextMenu){
            throw 'Either jqTree was not found or useContextMenu in jqTree is set to false.';
        }

        // Check if the parameter is a jquery object
        if(settings.menu instanceof jQuery) {
            $menuEl = settings.menu;
        } else if (typeof settings.menu == "string") {
            $menuEl = $(settings.menu);
        } else {
            throw 'You must pass a menu selector string or jquery element to the jqTreeContextMenu.';
        }
        $menuEl.hide();
        if (settings.onContextMenuItem) {
            this.bind('cm-jqtree.item.click', settings.onContextMenuItem);
        }

        // This hash holds all menu items that should be disabled for a specific node.
        var nodeToDisabledMenuItems = {};

        // Handle the contextmenu event sent from jqTree when user clicks right mouse button.
        $el.bind('tree.contextmenu', function (event) {
            var x = event.click_event.pageX;
            var y = event.click_event.pageY;
            var yPadding = 5;
            var xPadding = 5;

            var menuHeight = $menuEl.height();
            var menuWidth = $menuEl.width();
            var windowHeight = $(window).height();
            var windowWidth = $(window).width();

            // Make sure the whole menu is rendered within the viewport.
            if (menuHeight + y + yPadding > windowHeight) {
                y = y - menuHeight;
            }
            if (menuWidth + x + xPadding > windowWidth) {
                x = x - menuWidth;
            }

            // Must call show before we set the offset (offset can not be set on display: none elements).
            $menuEl.fadeIn(settings.menuFadeDuration);
            $menuEl.offset({ left: x, top: y });

            var dismissContextMenu = function () {
                $(document).unbind('click.jqtreecontextmenu');
                $el.unbind('tree.click.jqtreecontextmenu');
                $menuEl.fadeOut(settings.menuFadeDuration);
            };

            // Make it possible to dismiss context menu by clicking somewhere in the document.
            $(document).bind('click.jqtreecontextmenu', function (e) {
                if (x != e.pageX || y != e.pageY) {
                    dismissContextMenu();
                }
            });
            // Dismiss context menu if another node in the tree is clicked.
            $el.bind('tree.click.jqtreecontextmenu', function () {
                dismissContextMenu();
            });

            // Make the selection follow the node that was right clicked on (if desired).
            if (settings.selectClickedNode && $el.tree('getSelectedNode') !== event.node) {
                $el.tree('selectNode', event.node);
            }

            // Handle click on menu items, if it's not disabled.
            $menuEl.find('li').off('click.contextmenu').on('click.contextmenu', function (e) {
                e.stopImmediatePropagation();
                dismissContextMenu();
                $el.trigger('cm-jqtree.item.click', [event.node, $(this)]);
            });
        });

        this.disable = function () {
            if (arguments.length === 0) {
                // Called as: api.disable()
                $menuEl.find('li:not(.disabled)').addClass('disabled');
                $menuEl.find('li a').unbind('click');
                nodeToDisabledMenuItems = {};
            } else if (arguments.length === 1) {
                // Called as: api.disable(['edit','remove'])
                var items = arguments[0];
                if (typeof items !== 'object') {
                    return;
                }
                $menuEl.find('li > a').each(function () {
                    var hrefValue = $(this).attr('href');
                    var value = hrefValue.slice(hrefValue.indexOf("#") + 1, hrefValue.length);
                    if ($.inArray(value, items) > -1) {
                        $(this).closest('li').addClass('disabled');
                        $(this).unbind('click');
                    }
                });
                nodeToDisabledMenuItems = {};
            } else if (arguments.length === 2) {
                // Called as: api.disable(nodeName, ['edit','remove'])
                nodeToDisabledMenuItems[arguments[0]] = arguments[1];
            }
        };

        this.enable = function () {
            if (arguments.length === 0) {
                // Called as: api.enable()
                $menuEl.find('li.disabled').removeClass('disabled');
                nodeToDisabledMenuItems = {};
            } else if (arguments.length === 1) {
                // Called as: api.enable(['edit','remove'])
                var items = arguments[0];
                if (typeof items !== 'object') {
                    return;
                }

                $menuEl.find('li > a').each(function () {
                    var hrefValue = $(this).attr('href');
                    var value = hrefValue.slice(hrefValue.indexOf("#") + 1, hrefValue.length)
                    if ($.inArray(value, items) > -1) {
                        $(this).closest('li').removeClass('disabled');
                    }
                });

                nodeToDisabledMenuItems = {};
            } else if (arguments.length === 2) {
                // Called as: api.enable(nodeName, ['edit','remove'])
                var nodeName = arguments[0];
                var items = arguments[1];
                if (items.length === 0) {
                    delete nodeToDisabledMenuItems[nodeName];
                } else {
                    var disabledItems = nodeToDisabledMenuItems[nodeName];
                    for (var i = 0; i < items.length; i++) {
                        var idx = disabledItems.indexOf(items[i]);
                        if (idx > -1) {
                            disabledItems.splice(idx, 1);
                        }
                    }
                    if (disabledItems.length === 0) {
                        delete nodeToDisabledMenuItems[nodeName];
                    } else {
                        nodeToDisabledMenuItems[nodeName] = disabledItems;
                    }
                }
                if (Object.keys(nodeToDisabledMenuItems).length === 0) {
                    $menuEl.find('li.disabled').removeClass('disabled');
                }
            }
        };
        return this;
    };
} (jQuery));

 tools.highlighter = new function() {
        var highlighter;
        var iev;
        function saveHighlight() {
            var data = highlighter.serialize();
            resultStorage.setQuestionItem("highlighter", {
                "data": data
            });
            tools.magnifier.refresh()
        }
        function setHighlight() {
            if (!$("body").hasClass("highlighter"))
                return;
            if (!$(".ev_clearhighlight").is(":visible"))
                return;
            var found = false;
            var sel = rangy.getSelection();
            var ranges = sel.getAllRanges();
            $.each(ranges, function(i, val) {
                var nodes = val.getNodes();
                $.each(nodes, function(i, val) {
                    if (val.nodeType == 3)
                        val = val.parentNode;
                    if ($(val).hasClass("et2highlight"))
                        found = true
                })
            });
            if (found)
                highlighter.unhighlightSelection();
            else
                highlighter.highlightSelection("et2highlight");
            $(".et2highlight").each(function() {
                if ($(this).data("hasClose") != undefined)
                    return;
                $(this).data("hasClose", "1")
            });
            sel.removeAllRanges();
            saveHighlight()
        }
        var lastSelection = null;
        function checkSelectionMouse(evt) {
            if (!$("body").hasClass("highlighter"))
                return;
            if (!$(".ev_clearhighlight").is(":visible"))
                return;
            if ($(evt.target).is("input"))
                return;
            setHighlight();
            lastSelection = null
        }
        function checkSelectionKey(evt) {
            if (!$("body").hasClass("highlighter"))
                return;
            if (!$(".ev_clearhighlight").is(":visible"))
                return;
            var sel = rangy.getSelection();
            if (evt.which == 27) {
                lastSelection = null;
                sel.removeAllRanges();
                return
            }
            if (sel.isCollapsed) {
                if (lastSelection != null) {
                    rangy.deserializeSelection(lastSelection);
                    setHighlight();
                    lastSelection = null
                }
                return
            }
            lastSelection = rangy.serializeSelection(sel, true)
        }
        function highlightSelection(evt) {
            if (!$("body").hasClass("highlighter"))
                return;
            if (!$(".ev_clearhighlight").is(":visible"))
                return;
            if (lastSelection != null) {
                rangy.deserializeSelection(lastSelection);
                setHighlight();
                lastSelection = null;
                evt.preventDefault()
            }
        }
        this.init = function() {
            var that = this;
            $("#params").off("et2:highlighter:init");
            $("#params").on("et2:highlighter:init", function() {
                rangy.init();
                highlighter = rangy.createHighlighter();
                highlighter.addClassApplier(rangy.createClassApplier("et2highlight", {
                    ignoreWhiteSpace: true,
                    tagNames: ["span", "a"]
                }));
                var d = resultStorage.getQuestionItem("highlighter");
                if (d != null)
                    highlighter.deserialize(d.data);
                $("body").off("mouseup", checkSelectionMouse);
                $("body").off("mousedown", highlightSelection);
                $("body").off("keyup", checkSelectionKey);
                $("body").mouseup(checkSelectionMouse);
                $("body").mousedown(highlightSelection);
                $("body").keyup(checkSelectionKey);
                $(".ev_clearhighlight").click(function() {
                    highlighter.removeAllHighlights();
                    saveHighlight()
                });
                $(".ev_toolhigh").click(function() {
                    tools.highlighter.toggle()
                });
                if (isEnabled("highlighter")) {
                    that.enable();
                    if (iev == null)
                        iev = itemevent.start("highlighter")
                }
                $("body").removeClass("highdisabled");
                if (!$(".ev_clearhighlight").is(":visible"))
                    $("body").addClass("highdisabled")
            });
            $("#params").trigger("et2:highlighter:ready")
        }
        ;
        this.toggle = function() {
            if ($("body").hasClass("highlighter")) {
                this.disable();
                iev = itemevent.end(iev)
            } else {
                this.enable();
                iev = itemevent.start("highlighter")
            }
        }
        ;
        this.enable = function() {
            if ($(".ev_toolhigh").length == 0)
                return;
            $("body").addClass("highlighter");
            $(".ev_toolhigh span").addClass("icon-ok");
            $(".ev_toolhigh").attr("aria-checked", "true");
            enableButton(".ev_clearhighlight");
            setEnabled("highlighter")
        }
        ;
        this.disable = function() {
            $("body").removeClass("highlighter");
            $(".ev_toolhigh span").removeClass("icon-ok");
            $(".ev_toolhigh").attr("aria-checked", "false");
            disableButton(".ev_clearhighlight");
            setDisabled("highlighter")
        }
    }
    ;
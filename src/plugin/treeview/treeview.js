/**
 * Treeview plugin
 *
 * HTML:
 *  <div class="treeview_section">
 *      <ul id="treeview"></ul>
 *  </div>
 *  ps. ul-id = root_id
 *
 * JS:
 *  $("#treeview).treeview({
 *      list:   ,(必須)
 *      parent: ,(必須)
 *  })
 *
 */
(function($){
    var defaults = {    // 預設
        list : null,    //資料
        parent : "",    //開始搜尋的parent ID
        isCheckbox : false, //是否要checkbox
        isDocCount : false, //是否要顯示文件數
        root_id : null,    //root id
        element : null,
        // openFirstLevel: true,
        editMode:false
    }
        ,  settings = {};    //options + defaults = settings
    var fack_id = 1;
    var methods = {
        init : function (options) {
            return this.each(function () {
                settings = $.extend({}, defaults, options);
                settings.root_id = $(this).attr("id");
                settings.element = $(this);
                $(this).empty();
                $(this).data("setting",settings);
                Build($(this),settings.parent);
                CollapseClick();
            })
        },
        add : function (data) {
            settings = $(this).data("setting");
            return this.each(function () {
                addFod(data);
            })
        },
        remove: function (ID) {
            settings = $(this).data("setting");
            return this.each(function () {
                removeFod(ID);
            })
        },
        rename: function (data) {
            return this.each(function () {
                var li_id = settings.root_id+"_li_"+data.ID;
                var link = $("#"+li_id+" >span:nth-child(2) >a >span:nth-child(2)");
                var text=link.text();
                var temp = text.split("(");
                text = data.FolderName ;
                $("#"+li_id+" >span:nth-child(2) >a").data("name",text);
                if(temp.length>1){
                    text += "(" + temp[1];
                }
                link.text(text);
                settings.list = jQuery.grep(settings.list, function(value) {
                    if(value.ID=data.ID){
                        if(value.FolderName){
                            value.FolderName = data.FolderName
                        }
                    }
                    return value;
                });
            })
        },
        move: function (data) {
            var sourceLI = $("#treeview_li_"+data.sourceFod);
            var sourceParentUL = sourceLI.parent();
            var sourceLIHTML = sourceLI[0].outerHTML;
            $("#treeview_li_"+data.sourceFod).remove();
            if(sourceParentUL.find("li").length==0){
                var sourceParentLI = sourceParentUL.parent();
                sourceParentLI.find("span:first").removeAttr("class").css({"width":"15px","display":"inline-block"})
            }

            var destinationLI = $("#treeview_li_"+data.destinationFod);
            var destinationUL = $("#treeview_ul_"+data.destinationFod);
            if(destinationUL.length==0){
                destinationUL = $("<ul></ul>").attr("id",settings.root_id+"_ul_"+data.destinationFod);
                destinationLI.append(destinationUL)
                destinationLI.find("span:first").removeAttr("style").addClass("collapsible tv_expand");
            }else{
                destinationLI.find("span:first").removeClass("tv_collapse").addClass("tv_expand")
            }
            destinationUL.append(sourceLIHTML);
            destinationUL.slideDown();
        }
        ,recover:function () {
            settings = $(this).data("setting");
            return this.each(function () {
                fack_id=1;
                settings.list=[{FolderName:'新資料夾(1)',ID:"n"+1,IDRel:"n",Level:1,Rel_Sort:1}];
                $(this).find("li").remove();
                Build($(this),settings.parent);
            })
        }
        ,getList:function () {
            settings = $(this).data("setting");
            return settings.list;
        }
    };

    //建立樹


    function Build(element, parent) {
        var result = $.grep(settings.list, function(e){ return e.IDRel==parent; });
        $.each(result, function (i, v) {
            var subCount = 0;

            $.each(settings.list, function (index, value) {
                if(value.IDRel == v.ID)
                    subCount++;
            });

            $.each(settings.list, function (index, value) {
                if(value.ID==v.ID&&v.subFodCount)
                    subCount=value.subFodCount;
                if(value.ID==v.ID&&v.subRegCount)
                    subCount=value.subRegCount;
            });

            var li = addLI(v,subCount);
            element.append(li);

            // 如果有子項目, 加入ul child
            if(li&&subCount>0){
                var ul_id = settings.root_id+"_ul_"+v.ID;
                var ul = $("<ul></ul>").attr("id",ul_id);
                li.append(ul);
                // recursive (遞迴)
                Build(ul,v.ID);
            }
        })
    }

    function addLI(v,subCount) {
        var li_id = settings.root_id+"_li_"+v.ID;

        if($("#"+li_id).length>0) {
            return null;
        }
        //資料夾展開/閉合圖示
        var collapse_elem=$("<span></span>");
        if(subCount>0)
            collapse_elem.addClass("tv_collapse collapsible");
        else
            collapse_elem.css({width:"15px",display:"inline-block"});

        //文件數

        var docCount = 0;
        var countText = "";
        if(settings.isDocCount&&v.DocCount){
            docCount = parseInt(v.DocCount);
            countText = "("+docCount+")";
        }

        var name = v.FolderName;

        //連結
        var link_elem = $("<a></a>")
            .attr("data-enable",v.Enable)
            .attr("data-name",name)
            .attr("data-id",v.ID)
            .attr("data-count",docCount)
            .addClass("collapseClick a_unSelect")
            .append(
                $("<span></span>").addClass("ic_dir")
            ).append(
                $("<span></span>").text(name+countText)
            );
        if(settings.editMode){
            link_elem = $('<div></div>')
                .append(
                    $("<a style='color:#449d44' class='addFolder'><i class='fa fa-plus' aria-hidden='true'></i></a>")
                        .attr('id','new_'+v.ID)
                        .attr('data-id',v.ID)
                        .css('width','auto')
                )
                .append(
                    $("<a style='color:#c9302c' class='rmFolder'><i class='fa fa-minus' aria-hidden='true'></i></a>")
                        .attr('id','remove_'+v.ID)
                        .attr('data-id',v.ID)
                        .css('display',v.ID=='n1'?'none':'inline-block')
                        .css('width','auto')
                )
                .append(
                    $("<span></span>").addClass("ic_dir").css('margin-left','10px')
                )
                .append(
                    $("<input type='text' class='form-control input-sm'>")
                        .attr('id',v.ID)
                        .val(v.FolderName)
                        .css({"display": "inline","height": "18px"})
                );
            if(v.ID=="n1"){
                link_elem.prepend(
                    $("<a style='color:#449d44' class='addFolder'><i class='fa fa-plus' aria-hidden='true'></i></a>")
                        .attr('id','new_')
                        .attr('data-id','n')
                        .css('display','block')
                )
            }
        }

        // checkbox
        var checkbox_elem = "";
        if(settings.isCheckbox && v.IDRel!=""){
            checkbox_elem= $("<div></div>")
                .attr("data-toggle","buttons")
                .addClass("btn-group btn-checkbox")
                .append(
                    $("<label></label>")
                        .addClass("btn")
                        .append(
                            $("<input type='checkbox' name='item'>").attr("value",v.ID).attr("id","item_"+v.ID)
                        ).append(
                        $("<i></i>").addClass("fa fa-square-o fa-x")
                    ).append(
                        $("<i></i>").addClass("fa fa-check-square-o fa-x")
                    )
                )
        }

        //加入li child
        var li = $("<li></li>")
            .attr("id",li_id)
            .append(collapse_elem)
            .append(checkbox_elem)
            .append(
                $("<span></span>")
                    .css({"max-width":"400px","display":'inline-block'})
                    .append(link_elem)
            );
        return li
    }

    // 展開 & 閉合 & 點擊 功能
    function CollapseClick() {
        var root_id = "#"+settings.root_id;

        // if(settings.openFirstLevel) {
        //     //展開第一層
        //     $(root_id + " .collapsible:first").toggleClass("tv_collapse tv_expand");
        //     $(root_id + " .collapsible:first").closest("li").children('ul').slideToggle();
        // }

        // 展開或收縮資料夾
        $(document)
        //.off('click',root_id+" .collapsible")
            .on("click", root_id+" .collapsible", function(event) {
                event.preventDefault();
                var _this =$(this);

                _this.toggleClass("tv_collapse tv_expand");
                _this.closest('li').children('ul').slideToggle();

            });

        // 點擊資料夾
        $(document)
        //.off('click',root_id+" .collapseClick")
            .on("click", root_id+" .collapseClick", function(event) {
                event.preventDefault();
                var _this =$(this);
                _this.closest("li").find(">.collapsible").toggleClass("tv_collapse tv_expand");
                _this.closest("li").find(">.collapsible").closest('li').children('ul').slideToggle();
                //清除所有背景顏色

                $(root_id+" li>span>a").removeClass("a_selected").addClass("a_unSelect");
                //選取資料夾加入背景顏色(ic_dir & a)
                var li_id = "#"+$(this).closest("li").attr("id");
                $(li_id + ">span>a").toggleClass("a_unSelect a_selected");
            });

        //增加資料夾
        $(document)
            .on('click',root_id+" .addFolder",function (event) {
                event.preventDefault();
                fack_id++
                $(root_id).treeview("add",{FolderName:'新資料夾('+fack_id+")",ID:"n"+fack_id,IDRel:$(this).data("id"),Level:1,Rel_Sort:1})
            })

        //移除資料夾
        $(document)
            .on('click',root_id+" .rmFolder",function (event) {
                event.preventDefault();
                var thatID=$(this).data("id");
                $(root_id+"_li_"+thatID).remove()

                settings.list = $.grep(settings.list,function (a) {
                    return a.ID!=thatID;
                })
            })
    }

    function addFod(data) {
        settings.list.push(data);
        var li_id = settings.root_id+"_li_"+data.IDRel;
        var li = $("#"+li_id);
        var ul_id = settings.root_id+"_ul_"+data.IDRel;
        if(data.IDRel=='n'){
            ul_id = settings.root_id;
        }
        if($("#"+ul_id).length==0) {
            var ul = $("<ul></ul>").attr("id", ul_id);
            li.append(ul);
            if(!li.find("span:first").hasClass("collapsible"))
                li.find("span:first").removeAttr("style").addClass("tv_expand collapsible");
        }else{
            var ul = $("#"+ul_id);
        }
        var sub_li = addLI(data,data.subFodCount);
        if(sub_li!=null)
            ul.append(sub_li).slideDown();
    }

    function removeFod(ID) {
        var li_id = settings.root_id+"_li_"+ID;
        $("#"+li_id).remove();
        settings.list = jQuery.grep(settings.list, function(value) {
            return value.ID != ID;
        });
    }

    $.fn.treeview = function (method) {
        if(methods[method])
            return methods[method].apply(this, Array.prototype.slice.call(arguments,1));
        else if(typeof method === 'object' || !method)
            return methods.init.apply(this,arguments);
        else
            $.error("Method:"+ method + 'doesn\'t support on jQuery.treeview')
    }
})(jQuery);
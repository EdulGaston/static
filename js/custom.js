var shadeDiv = "<div id='_loading' style='display: block; z-index: 9999; position: fixed;position: absolute;left: 0;top: 0;width: 100%;height: 100%;font-size: 1px;overflow: hidden;background: #FFF;'></div>"
document.write(shadeDiv);
function closes() {
	$("#_loading").fadeOut("normal", function() {
		$(this).remove();
	});
}
+function ($) {
	'use strict';
	var _timer;
	$.parser.onComplete = function() {
		if (_timer){
			clearTimeout(_timer);
		}
		_timer = setTimeout(closes,100);
	}
	var o = {
		top: null,
		parent: null,
		params: {},
		dialog: null,
		buttons: [],
		callback: null
	}
	var page = {
		ctrl: false,
		alt: false,
		shift: false,
		mounted: function(){
		},
		enableButton: function(i) {
			if(o.buttons.length > i){
				o.buttons[i].linkbutton('enable');
			}
		},
		disableButton: function(i) {
			if(o.buttons.length > i){
				o.buttons[i].linkbutton('disable');
			}
		},
		setData: function(data) {
			o.callback && o.callback(data);
		},
		closeDialog: function(data) {
			page.setData(data);
			o.dialog && o.dialog.dialog('destroy');
		}
	};
	
	$(document).on('keydown', function(e) {
	    if (e.ctrlKey) {
	    	page.ctrl = true;
	    }
	    if (e.altKey) {
	    	page.alt = true;
	    }
	    if (e.shiftKey) {
	    	page.shift = true;
	    }
	});
	$(document).on('keyup', function(e) {
	    if (!e.ctrlKey) {
	    	page.ctrl = false;
	    }
	    if (!e.altKey) {
	    	page.alt = false;
	    }
	    if (!e.shiftKey) {
	    	page.shift = false;
	    }
	});
	
	page.dialog = o;
	window.page = page;
	
	page.showMessage = function(msg, fn){
	    $.messager.alert({
	    	icon:'info',
	    	title:'提示',
	        msg:msg,
	        fn:function(){
	        	fn&&fn()
	        }
	    });
	}
	page.errorMessage = function(msg, fn){
	  $.messager.alert({
		  icon:'error',
		  title:'操作失败',
	      msg:msg,
	      fn:function(){
	      	fn&&fn()
	      }
	  });
	}
	page.buildParams = function(form){
		var query = form.serializeArray();
		var params={};
		$.each(query, function(i, item){
			if (params[item.name]==null){
				params[item.name]=item.value
			}else{
				params[item.name]=params[item.name]+","+item.value
			}
		});
		return params;
	}
	page.ajax = function(url, method, data, success, complete){
		$.ajax({
		  	type: method || 'get',
		  	dataType: 'json',
		  	//timeout: 30000,
		  	url: url,
			data: data || {},
			beforeSend:function(xhr) {
				xhr.setRequestHeader('platform', typeof navigator!=='undefined'?navigator.platform:'none');
		    	//xhr.setRequestHeader('Authorization', 'Bearer ' + sessionStorage.getItem("token")||'');
		    }
		}).done(function(data, status, xhr){
			success && success(data);
		}).fail(function(xhr, status, error){
			console.error(xhr.status, status, error);
			var code = Math.floor(xhr.status / 100);
			if(xhr.status==0){
				if(status==='timeout'){
					page.errorMessage('请求超时错误！<br>Request Timeout.')
				}else{
					page.errorMessage('连接服务器失败！<br>Connection to server failed.')
				}
			}else if(code==4){
				if(xhr.status==400){
					page.errorMessage('请求返回错误！<br>Bad Request.')
				}else if(xhr.status==401||xhr.status==403){
					page.errorMessage('请求未授权错误！<br>Unauthorized.')
				}else if(xhr.status==404){
					page.errorMessage('请求地址错误！<br>Not Found.')
				}else if(xhr.status==405){
					page.errorMessage('请求方式错误！<br>Method Not Allowed.')
				}else if(xhr.status==406){
					page.errorMessage('请求类型错误！<br>Not Acceptable.')
				}else if(xhr.status==408){
					page.errorMessage('请求超时错误！<br>Request Timeout.')
				}else{
					page.errorMessage('客户端请求错误！<br>Client request error.')
				}
			}else if(code==5){
				page.errorMessage('服务器内部错误！<br>Internal server error.')
			}
		}).always(function(){
			complete && complete();
		});
	}
	page.get = function(url, data, success, complete){
		page.ajax(url, 'get', data, success, complete);
	}
	page.post = function(url, data, success, complete){
		page.ajax(url, 'post', data, success, complete);
	}
	function comboboxmap(array, valueField, textField, blank){
		var items = $.map(array, function(n, i){
			if(typeof n==='string'){
				return {
					value: n,
					text: n
				}
			}else{
				return {
					value: n[valueField],
					text: n[textField]
				}
			}
		});
		return blank?[{value:'',text:'请选择'}].concat(items):items;
	}
	page.comboboxLoader = function(url, blank, params, valueField, textField){
		params = params || {};
		valueField = valueField || 'id';
		textField = textField || 'name';
		return $.proxy(function(p, success, error){
			if(!url){
				return false;
			}
			page.post(url,$.extend({}, p, params), function(data){
				var items = [];
				if(data && data.code==='ok'){
					if(data.data instanceof Array){
						items = data.data;
					}else{
						items = data.data.list;
					}
				}
				success(comboboxmap(items, valueField, textField, blank));
			},function(){
				error.apply(this, arguments);
			});
		})
	}
	page.gridLoader = function(params, success, error){
		let opts = $(this).datagrid("options");
		if(!opts.url){
			return false;
		}
		page.post(opts.url, params, function(data){
			success(data)
		},function(){
			error.apply(this, arguments);
		});
	}
	
	var inc = 1;
	page.openDialog = function(options){
		var width = options.width ? options.width: $(window).width()*0.6 <= 650 ? $(window).width()-60: $(window).width()*0.6;
		var height = options.height ? options.height: $(window).height()*0.84 <= 480 ? $(window).height()-10: $(window).height()*0.84;
		var top = options.top ? options.top<0 ? $(window).height()*0.08: options.top: null;
		var o = {
			title:options.title||'对话框',
			top: top,
			width: width,
			height: height,
			url: options.url||'',
			params: options.params||{},
			confirm: {
				title: options.confirm && options.confirm.title ? options.confirm.title : '取消',
				handler: options.confirm? options.confirm.handler: null
			},
			cancel: {
				title: options.cancel && options.cancel.title ? options.cancel.title : '取消',
				handler: options.cancel? options.cancel.handler: null
			},
			callback: options.callback
		}
		var id = ''+ (++inc)+new Date().getTime();
		var dialog = $('<div id="ref_'+id+'"></div>').appendTo('body');
		var content = '<iframe id="iframe_'+id+'" scrolling="auto" frameborder="0" src="'+o.url+'" style="width:100%;height:100%;margin-bottom:-5px;"></iframe>';
	    var buttons = [];
	    if(o.confirm.handler){
			buttons.push({
				id: 'btn_ok_'+id,
				text: o.confirm.title,
		      	iconCls:'icon-ok',
		      	handler:function(){
		        	var win = $("#iframe_"+id)[0].contentWindow;
		        	o.confirm.handler(function(){dialog.dialog('destroy');},win,dialog);
		        }
			});
	    }
	    buttons.push({
	    	id: 'btn_close_'+id,
	        text: o.cancel.title,
	        iconCls:'icon-cancel',
	        handler:function(){
	        	dialog.dialog('destroy');
	        }
	    });
		function handler(){
			var width = options.width ? options.width: $(window).width()*0.6 <= 650 ? $(window).width()-60: $(window).width()*0.6;
			var height = options.height ? options.height: $(window).height()*0.84 <= 480 ? $(window).height()-10: $(window).height()*0.84;
			var left = ($(window).width() - $(dialog).width())/2;
	    	if(dialog){
		    	dialog.dialog('resize',{
		    		left: left,
		    		width: width,
		    		height: height
		    	});
	    	}
		}
		dialog.dialog({
		    title: o.title,
		    top: o.top,
		    width: o.width,
		    height: o.height,
		    resizable:true,
		    closed: false,
		    cache: false,
		    content: content,
		    modal: true,
		    maximizable:true,
			loader: page.gridLoader,
		    onDestroy: function(){
		    	o.cancel.handler && o.cancel.handler(dialog);
		    	$(window).unbind('resize',handler);
		    },
		    onBeforeOpen: function(){
		    	$(window).bind('resize',handler);
	        	var win = $("#iframe_"+id)[0].contentWindow;
	        	win.onload=function(){
	        		if(win.page && win.page.dialog){
	        			win.page.dialog.top = page.dialog.top||window;
		        		win.page.dialog.parent = window;
		        		win.page.dialog.params = o.params;
		        		win.page.dialog.dialog = dialog;
		        		win.page.dialog.buttons = $.map(buttons,function(n,i){return $('#'+n.id);});
		        		win.page.dialog.callback = o.callback;
		        		win.page.mounted();
	        		}
	        	}
		    },
		    onClose : function() {  
		    	dialog.dialog('destroy');
	        },
		    buttons:buttons
		});
	}
	page.referDialog = function(refer){
		return $.proxy(function(e){
			page.openDialog(refer(e));
		},this)
	}
	function createFrame(url) {
		return '<iframe scrolling="auto" frameborder="0" src="' + url + '" style="width:100%;height:100%;margin-bottom:-5px;"></iframe>';
	}
	page.openUrl = function(options) {
		var o = {
			ele: options.ele||'#main-tabs',
			text: options.text,
			url: options.url,
			iconCls: options.iconCls
		}
		var Tabs = $(o.ele);
		if(Tabs.length==0){
			Tabs = top.$(o.ele);
		}
		if (Tabs.tabs('exists', o.text)) {
			//Tabs.tabs('select', o.text);
			Tabs.tabs('close', o.text);
		}
		var tab = {
			title : o.text,
			closable : true,
			content : createFrame(o.url),
			tools : [ {
				iconCls : 'icon-mini-refresh',
				handler : function() {
					var iframes = Tabs.tabs('getSelected').find('iframe');
					if(iframes && iframes.length>0){
						iframes[0].contentWindow.location.href=iframes[0].src;
					}
				}
			} ]
		};
		if(o.iconCls){
			tab.iconCls=o.iconCls;
		}
		Tabs.tabs('add', tab);
	}
	page.createTabsMenu = function(ele){
		var Tabs = ele||$("#main-tabs");
		var tabsMenu = $('<div id="tabsMenu" class="easyui-menu" style="width:120px;"><div name="refresh" data-options="iconCls:\'icon-reload\'">刷新</div><div name="close">关闭</div><div name="other">关闭其他</div><div name="all">关闭所有</div></div>').appendTo('body');
		Tabs.tabs({
			onContextMenu : function(e, title) {
				e.preventDefault();
				Tabs.tabs("select", title);
				tabsMenu.menu('show', {
					left : e.pageX,
					top : e.pageY,
					hideOnUnhover : false
				}).data("tabTitle", title);
			}
		})
		function itemHandler(menu, type) {
			var curTabTitle = $(menu).data("tabTitle");
			if(type=="refresh"){
				var iframes = Tabs.tabs('getSelected').find('iframe');
				if(iframes && iframes.length>0){
					iframes[0].contentWindow.location.href=iframes[0].src;
				}
				return;
			}
			if (type === "close") {
				Tabs.tabs("close", curTabTitle);
				return;
			}
			var allTabs = Tabs.tabs("tabs");
			var closeTabsTitle = [];
			$.each(allTabs, function() {
				var opt = $(this).panel("options");
				if (opt.closable && opt.title != curTabTitle && type === "other") {
					closeTabsTitle.push(opt.title);
				} else if (opt.closable && type === "all") {
					closeTabsTitle.push(opt.title);
				}
			});
			for ( var i = 0; i < closeTabsTitle.length; i++) {
				Tabs.tabs("close", closeTabsTitle[i]);
			}
		}
		tabsMenu.menu({
			onClick : function(item) {
				itemHandler(this, item.name);
			}
		});
	}
	var timer,title = top.document.title;
	page.stopFlashTitle = function(){
		if(timer){
			clearInterval(timer);
			timer = null;
			top.document.title = title;
		}
	}
	page.startFlashTitle = function(){
		var index = 0;
		page.stopFlashTitle();
		timer = setInterval(function() {
			if(index++ % 2){
				top.document.title = '【新消息】' + title;
			}else{
				top.document.title = '【　　　】' + title;
			}
			if(index > 60){
				page.stopFlashTitle();
			}
		}, 500);
		document.addEventListener("visibilitychange", function() {
			page.stopFlashTitle();
		});
		$('html').click(function() {
			setTimeout(function() {
				page.stopFlashTitle();
			},500);
		});
	}
	page.playSound = function() {
		page.startFlashTitle();
		var audio = $("#audioPlay");
		if(!audio[0]){
			$('<audio id="audioPlay" hidden="true" src="message.mp3"></audio>').appendTo("body");
		}
		$('#audioPlay')[0].play();
	}
	function getColumnMenu(ele){
	    var cmenu,id = ele.data('menu');
	    if(id){
		    cmenu = $('#'+id);
	    }else{
		    id = 'datagrid_menu_'+ (++inc)+new Date().getTime();
		    ele.data('menu',id);
		    cmenu = $('<div id="'+id+'"/>').appendTo('body');
		    cmenu.menu({
		        onClick: function(item){
		            if (item.iconCls == 'icon-yes'){
		                ele.datagrid('hideColumn', item.name);
		                cmenu.menu('setIcon', {
		                    target: item.target,
		                    iconCls: 'icon-blank'
		                });
		            } else {
		                ele.datagrid('showColumn', item.name);
		                cmenu.menu('setIcon', {
		                    target: item.target,
		                    iconCls: 'icon-yes'
		                });
		            }
		        }
		    });
		    var fields = ele.datagrid('getColumnFields');
		    for(var i=0; i<fields.length; i++){
		        var field = fields[i];
		        var col = ele.datagrid('getColumnOption', field);
		        if(!col.hidden){
			        cmenu.menu('appendItem', {
			            text: col.title,
			            name: field,
			            iconCls: 'icon-yes'
			        });
		        }
		    }
	    }
	    return cmenu;
	}
	function isEnable(ele, index, row){
		var toolbars = $(ele).datagrid('options').toolbar;
		for(var i=0;i<toolbars.length;i++){
			if(toolbars[i]!=='-'){
				var btn_id = toolbars[i].id;
				if(btn_id){
					var btn = $('#'+btn_id);
					if(toolbars[i].isEnable && !toolbars[i].isEnable(index,row)){
						btn.linkbutton('disable');
					}else{
						btn.linkbutton('enable');
					}
				}
			}
		}
	}
	page.pagegrid = {
		method:'post',
		height: 'auto',
		striped: true ,
		fit: true ,
		loadMsg: '加载中...' ,
		rownumbers: true ,
		fitColumns: false ,
		singleSelect: true,
		selectOnCheck: true,
		checkOnSelect: false,
		collapsible: true,
		remoteSort: false,
		pagination: true,
		pageNumber: 1,
		pageSize: 50,
		pageList: [50,200,300,500,1000],
		queryParams: {},
		columns: [],
		url: '',
		loader: page.gridLoader,
		onSelect: function(index,row){
			isEnable(this, index, row);
		},
		onLoadSuccess: function(data){
			isEnable(this);
		},
		loadFilter: function(data){
			if(data && data.code==='ok'){
	    		return {
	    			total:data.data.total,
	    			rows:data.data.list
	    		};
	    	}else{
	    		page.errorMessage(data.msg);
	    	}
		},
        onDblClickRow: function(index,row){
        	page.dialog.callback && page.closeDialog(row);
        },
		onBeforeLoad: function(param){},
		onHeaderContextMenu: function(e, field){
			e.preventDefault();
			var cmenu = getColumnMenu($(this));
			cmenu.menu('show',{
				left:e.pageX,
				top:e.pageY
			});
		},
	    onRowContextMenu: function(e,index,row){},
	    toolbar: []
	}
	page.listgrid = {
		pagination: false,
		loadFilter: function(data){
			if(data && data.code==='ok'){
	    		return {
	    			rows: data.data
	    		};
	    	}else{
	    		page.errorMessage(data.msg);
	    	}
		}
	}
	page.multiselectgrid = {
		singleSelect: false,
		ctrlSelect: true
	}
	function formatRow(format, value, row, index){
		if(!format){
			return value;
		}else if(typeof format==='object'){
			if(format[value]){
				if(format[value].formatter){
					return format[value].formatter(value, row, index);
				}else{
					if(format[value].style){
						return '<span style="'+format[value].style+'">'+format[value].name+'</span>';
					}else{
						return '<span>'+format[value].name+'</span>';
					}
				}
			}else{
				return value;
			}
		}else if(typeof format==='function'){
			return format(value, row, index);
		}else{
			return value;
		}
	}
	function extraRow(name, format, value, row, index){
		if(typeof row.extra!=='object' || typeof row.extra[name]==='undefined'){
			return '';
		}
		return formatRow(format, row.extra[name], row, index);
	}
	page.format = function(format){
		if(typeof format==='string'){
			format = page.formats[format];
		}
		return $.proxy(formatRow, this, format)
	}
	page.extra = function(name, format){
		if(typeof format==='string'){
			format = page.formats[format];
		}
		return $.proxy(extraRow, this, name, format)
	}
	page.combox = function(format, blank){
		if(typeof format!=='string'){
			return [];
		}
		var obj = page.formats[format];
		if(!obj){
			return [];
		}
		var items = $.map(obj, function(value, key){
			return {
				value: key,
				text: value.name
			};
		});
		return blank?[{value:'',text:'请选择'}].concat(items):items;
	}
	page.formats = {
		'amount':function(val, row, index){
			if(!val){
				val = 0;
			}
			return val.toFixed(6);
		},
		'status':{
			'N':{
				name:'禁用',
				style:'color:red'
			},
			'Y':{
				name:'启用',
				style:'color:green'
			}	
		},
		'wallet.status':{
			'N':{
				name:'未激活',
				style:'color:red'
			},
			'Y':{
				name:'已激活',
				style:'color:green'
			}	
		},
		'wallet.type':{
			'D':{
				name:'代理',
				style:'color:red'
			},
			'T':{
				name:'资金',
				style:'color:green'
			}
		},
		'token':{
			'TRX':{
				name:'TRX',
				style:'color:red'
			},
			'USDT':{
				name:'USDT',
				style:'color:green'
			},
			'USDC':{
				name:'USDC',
				style:'color:blue'
			}
		},
		'exchange.status':{
			'W':{
				name:'待处理',
				style:'color:gray'
			},
			'P':{
				name:'处理中',
				style:'color:blue'
			},
			'Y':{
				name:'成功',
				style:'color:green'
			},
			'N':{
				name:'失败',
				style:'color:red'
			}
		},
		'exchange.transferStatus':{
			'W':{
				name:'待处理',
				style:'color:gray'
			},
			'P':{
				name:'处理中',
				style:'color:blue'
			},
			'Y':{
				name:'成功',
				style:'color:green'
			},
			'N':{
				name:'失败',
				style:'color:red'
			}
		},
		'rent.status':{
			'W':{
				name:'待处理',
				style:'color:gray'
			},
			'P':{
				name:'处理中',
				style:'color:blue'
			},
			'Y':{
				name:'成功',
				style:'color:green'
			},
			'N':{
				name:'失败',
				style:'color:red'
			}
		},
		'rent.delegateStatus':{
			'W':{
				name:'待处理',
				style:'color:gray'
			},
			'P':{
				name:'处理中',
				style:'color:blue'
			},
			'Y':{
				name:'成功',
				style:'color:green'
			},
			'N':{
				name:'失败',
				style:'color:red'
			}
		},
		'rent.undelegateStatus':{
			'W':{
				name:'待处理',
				style:'color:gray'
			},
			'P':{
				name:'处理中',
				style:'color:blue'
			},
			'Y':{
				name:'成功',
				style:'color:green'
			},
			'N':{
				name:'失败',
				style:'color:red'
			}
		},
		'transaction.contract':{
			'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t':{
				name:'USDT',
				style:'color:green'
			},
			'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8':{
				name:'USDC',
				style:'color:blue'
			}
		},
		'transaction.method':{
			'a9059cbb':{
				name:'transfer'
			},
			'23b872dd':{
				name:'transferFrom'
			}
		},
		'transaction.status':{
			'Y':{
				name:'已确认',
				style:'color:green'
			},
			'N':{
				name:'待确认',
				style:'color:navy'
			}
		},
		'transaction.resource':{
			'1':{
				name:'能量',
				style:'color:green'
			},
			'0':{
				name:'带宽',
				style:'color:navy'
			}
		},
		'transaction.type':{
			'DelegateResourceContract':{
				name:'代理资源',
				style:'color:navy'
			},
			'UnDelegateResourceContract':{
				name:'回收资源',
				style:'color:gray'
			},
			'TransferContract':{
				name:'账户转账',
				style:'color:red'
			},
			'TriggerSmartContract':{
				name:'合约转账',
				style:'color:green'
			},
			'AccountCreateContract':{
				name:'激活账户',
				style:'color:blue'
			}
		},
		'contract.type':{
			'5':{name:'触发智能合约'},
			'1':{name:'TRX 转账'},
			'6':{name:'TRC10 转账'},
			'2':{name:'质押资产 1.0'},
			'3':{name:'解锁资产 1.0'},
			'9':{name:'质押资产 2.0'},
			'10':{name:'解锁资产 2.0'},
			'11':{name:'提取 TRX'},
			'12':{name:'代理资源'},
			'13':{name:'回收资源'},
			'14':{name:'取消解锁资产'},
			'4':{name:'投票'},
			'7':{name:'领取投票收益'},
			'8':{name:'更新账户权限'}
		},
		'contractType':{
			'31':{name:'触发智能合约'},
			'1':{name:'TRX 转账'},
			'2':{name:'TRC10 转账'},
			'11':{name:'质押资产 1.0'},
			'12':{name:'解锁资产 1.0'},
			'54':{name:'质押资产 2.0'},
			'55':{name:'解锁资产 2.0'},
			'56':{name:'提取 TRX'},
			'57':{name:'代理资源'},
			'58':{name:'回收资源'},
			'59':{name:'取消解锁资产'},
			'4':{name:'投票'},
			'13':{name:'领取投票收益'},
			'46':{name:'更新账户权限'}
		},
		'table.template':{
			controller:{
				name:'Controller.java'
			},
			criteria:{
				name:'Criteria.java'
			},
			service:{
				name:'Service.java'
			},
			serviceImpl:{
				name:'ServiceImpl.java'
			},
			repository:{
				name:'Repository.java'
			},
			entity:{
				name:'Entity.java'
			},
			edit:{
				name:'edit.ftl'
			},
			list:{
				name:'list.ftl'
			}
		}
	}
	$(function(){
		page.createTabsMenu();
	})
}(jQuery);

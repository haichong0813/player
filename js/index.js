;(function($, win){
	var $songProgressBar = $('#songProgressBar'), //歌曲进度条面板
	$songProgressLoad = $('#songProgressLoad'), //歌曲加载进度面板
	$songProgressCurrent = $('#songProgressCurrent'), //当前歌曲进度条位置
	$songProgressHideBar = $('#songProgressHideBar'), //歌曲进度条占位面板
	$volumeProgressCurrent = $('#volumeProgressCurrent'), //当前音量进度条位置
	$volumeCurrentBtn = $('#volumeCurrentBtn'), //音量游标按钮
	$volumeProgressBar = $('#volumeProgressBar'), //音量进度条面板
	$volumePanel = $('#volumePanel'), //音量面板
	$volumeBtn = $('#volumeBtn'), //音量按钮
	$playControl = $('#playControl'), //播放控制
	$playBtn = $('#playBtn'), //播放按钮
	$pauseBtn = $('#pauseBtn'), //暂停按钮
	$title = $('#title'), //歌曲名和歌手名
	$coverImage = $('#coverImage'), //封面图片
	$lrc = $('#lrc'), //歌词元素
	$lrcPanel = $('#lrcPanel'), //歌词面板
	$playList = $('#playList'), //播放列表
	$playListBtn = $('#playListBtn'), //显示播放列表按钮
	soundId = 'mySound', //音频ID
	songTime = 0, //歌曲时间
	progressWidth = 90, //进度条宽度
	playlistId = 0, //播放列表ID
	player = player || {};
	
	//soundManager配置
	soundManager.url = 'swf/';
	soundManager.debugMode = false;

	player.css = {
		vs: 'vs', //显隐 visibility: hidden;
		bd: 'bd', //边框颜色 border-color: #BBB
		hg: 'hg', //高亮歌词 color: #393c4b
		cr: 'cr' //高亮播放列表 background-color: #30B192;color: #FFF
	};

	player.init = function(){
		this.fn.create();
		this.fn.createPlayListUI();
		this.fn.fillData();
		this.fn.bind();
	};

	player.fn = {
		create: function(callback){
			playlistId = playlistId ? playlistId : 0;
			
			if(player.sound){
				player.sound.destruct(); //销毁音频对象
				if(playlistId == playlist.length){ //播放列表循环播放
		            playlistId = 0;
		        }
			}

			//初始化音频对象
		  	soundManager.onready(function(){
		  		player.sound = soundManager.createSound({
			        id: soundId,//音频ID
			        url: playlist[playlistId].mp3,//播放地址
			        volume: 50,//音量大小
			        autoLoad: true,//自动加载
			        // autoPlay: true,
			        onload:function(){
			        	if(this.readyState == 3){
			        		songTime = Math.floor((this.bytesTotal/this.bytesLoaded)*this.duration);//记录歌曲时间
			      			callback && callback();
			        	}else if(this.readyState == 2){
			        		alert(this.url + ' 音频加载失败');
			        	}else if(this.readyState == 1){
			        		alert('正在加载中');
			        	}else if(this.readyState == 0){
			        		alert('未初始化');
			        	}else{
			        		alert('情况好乱');
			        	}
			      	},
			      	whileloading: function(){
			      		var songProgressLoad = (this.bytesLoaded / this.bytesTotal) * progressWidth;
			      		//判断当前进度是否越界
					    if(songProgressLoad <= progressWidth){
					    	$songProgressLoad.css('width', songProgressLoad + '%');//设置进度条
					    }
			      	},
			      	whileplaying: function() {
					    var songProgressCurrent = (this.position / this.duration) * progressWidth,//当前播放进度
					    pos = (this.position / 1000).toFixed();//当前播放时间

					    //判断当前进度是否越界
					    if(songProgressCurrent >= progressWidth){
					    	return;
					    }
					    $songProgressCurrent.css('width', songProgressCurrent + '%');//设置进度条

				    	//判断当前播放时间是否匹配到歌词对象
						if(player.lrc.options.data[pos]){
							//判断时间帧，防止多次执行
							if(pos != player.lrc.options.index){
								player.lrc.options.index = pos;//记录歌词下标
								$lrc.animate({'top': '-=24px'},'slow').find('p').removeClass(player.css.hg)
								.end().find('p[time='+ pos +']').addClass(player.css.hg);//滚动歌词，并高亮当前行歌词
							}
						}
				  	},
				    onfinish: function() {
					    $songProgressCurrent.animate({'width':0},'slow');//重置进度条
					    $lrc.animate({'top':0},'slow');//重置歌词位置
						
						++playlistId;
					    player.fn.create(function(){
					    	player.sound.play();
					    });
					    player.fn.fillData();
					}
			    });
		  	});
		},
		fillData: function(){
			$coverImage[0].src = playlist[playlistId].coverImage; //填充封面图片
			$title.text(playlist[playlistId].songName +' - '+ playlist[playlistId].singerName); //填充歌曲信息
			player.lrc.getData(playlist[playlistId].lrc); //填充歌词
			player.fn.highCurrentLyrics(); //高亮当前
		},
		createPlayListUI: function(){
			var html = [];
			for(var i = 0, len = playlist.length; i < len; i++){
				html[i] = '<li><span>'+ (i + 1) +'.</span>'+ playlist[i].songName +' - '+ playlist[i].singerName +'</li>';
			}
			$playList.html('<ul>' +html.join(' ')+ '</ul>');
		},
		highCurrentLyrics:function(){
			$playList.find('li').eq(playlistId).addClass(player.css.cr).siblings().removeClass(player.css.cr);//高亮当前
		},
		bind: function(){

			//播放控制
			$playControl.click(function(){
				togglePlay();
			});

			//打开音量面板
			$volumeBtn.click(function(){
				($volumePanel.is(':hidden')) ? $volumePanel.show() : $volumePanel.hide();
			});

			//播放列表
			$playList.on('click', 'li', function(){
				playlistId = $(this).index();

				//播放歌曲
				player.fn.create(function(){
					player.sound.play();
				});
				player.fn.fillData();
				
				//重置元素
				$songProgressCurrent.animate({'width':0},'slow'); //重置进度条
				$lrc.animate({'top':0},'slow'); //重置歌词位置
				togglePlay(true);
			});

			//显示播放列表
			$playListBtn.click(function(){
				$(this).toggleClass(player.css.bd);
				$lrcPanel.toggleClass(player.css.vs);
				$playList.toggleClass(player.css.vs);
			});

			//指定进度条位置开始播放
			$songProgressHideBar.click(function(event){
				player.sound.pause();//暂停播放
				togglePlay(true);//显示按钮

				var pos = player.volume.getAbsPos(this),//获取进度条容器位置
				page = player.volume.getPageXY(event),//获取鼠标位置
				songProgressCurrent = ((page.x - pos.x) / $(this).width()) * progressWidth,//当前进度条位置百分比
				secondWidth = songTime / $(this).width(),//歌曲每秒所占宽度
				currentPlayTime = (page.x - pos.x) * secondWidth;//当前播放时间

				//设置进度条位置
				$songProgressCurrent.animate({'width': songProgressCurrent + '%'},'slow',function(){
					player.sound.setPosition(currentPlayTime);//指定时间播放歌曲
					player.sound.resume();//恢复歌曲
					player.sound.play();//播放歌曲
				});

				player.lrc.scroll(currentPlayTime);//滚动歌词
			});

			//按下音量游标
			$volumeCurrentBtn.mousedown(player.volume.down);

			//移动音量游标
			$(document).mousemove(player.volume.move);

			//放下音量游标
			$(document).mouseup(player.volume.up);
		}
	};

	//歌词
	player.lrc = {
		options:{
			index: -1, //记录歌词下标
			data: {} //歌词数据
		},
		//根据歌曲播放进度滚动歌词
		scroll:function(time){
			var jumpTime = 0;//记录最后一个小于或等于它的时间
			//找到跳转的位置
			for(var item in player.lrc.options.data){
				if(item <= time / 1000){
					jumpTime = item;
				}
			}
			
			//判断是否找到歌词
			if(jumpTime){
				var $jump = $lrc.find('p[time='+ jumpTime +']'),
				currentTop = $jump.offset().top - $lrc.offset().top - parseInt($lrc.css('padding-top'));//计算滚动位置
				$jump.addClass(player.css.hg).siblings().removeClass(player.css.hg);//高亮当前歌词
				$lrc.animate({'top': -currentTop},'slow');//滚动歌词到指定位置
			}else{
				$lrc.find('p').removeClass(player.css.hg);//重置相关元素
				$lrc.animate({'top': 0},'slow');//滚动歌词到原位
			}
		},
		//读取歌词文件
		getData:function(url){
			player.lrc.options.data = {};//清空歌词对象
	        $.get(url, function(data){
	        	var arr = data.split("\n");//分割每行歌词
	        	//遍历歌词
	        	for(var i = 0, len = arr.length; i < len; i++){
	        	 	var text = arr[i].replace(/\[\d*:\d*((\.|\:)\d*)*\]/g,''),//获取歌词
	        	 	timeArr = arr[i].match(/\[\d*:\d*((\.|\:)\d*)*\]/g);//获取时间帧
	        	 	if(timeArr){
	        	 		//遍历时间帧
	        	 		for(var j = 0, lenn = timeArr.length; j < lenn; j++){
	        	 			var min = Math.floor(timeArr[j].match(/\[\d*/i).toString().slice(1)),//分
	        	 			sec = Math.floor(timeArr[j].match(/\:\d*/i).toString().slice(1)),//秒
	        	 			time = min * 60 + sec;//转换时间
	        	 			player.lrc.options.data[time] = $.trim(text);//歌词对象
	        	 		}
	        	 	}
	        	}
	        	player.lrc.createUI(player.lrc.options.data);//创建歌词结构
	        });
		},
		//创建歌词结构
		createUI:function(data){
			var i = 0, html = [];
        	for(var item in data){
        		html[i]= '<p time='+ item +'>' + data[item] + '</p>';
        		i++;
        	}
        	$lrc.html(html.join(' '));
		}
	};

    //调整音量
    player.volume = {
    	options:{
    		$dragging: null,//当前拖拽对象
   			diffXY: null,//元素位置和鼠标位置之间的差值
			dragXY: null,//元素跟随鼠标的位置
			pageXY: null,//鼠标位置
			offsetXY: null,//元素相对视窗的相对坐标
			scrollXY: null,//滚动条的距离
			containerXY: null,//容器位置
			volHeight: 0,//音量位置
			timer: null//鼠标移动时间器
    	},
    	down:function(event){
    		player.volume.options.diffXY = player.volume.getDiffXY(this,event);
			player.volume.options.containerXY = player.volume.getAbsPos($volumeProgressBar[0]);//容器位置
			player.volume.options.volHeight = $volumeProgressBar.height();//音量进度条高度
			player.volume.options.$dragging = $(this);//记录当前拖拽对象
    	},
    	move:function(event){
			if(player.volume.options.$dragging !== null){
				player.volume.options.pageXY = player.volume.getPageXY(event);
				player.volume.options.dragXY = player.volume.getDragXY(event);
				
				var offsetY = player.volume.options.dragXY.y - player.volume.options.containerXY.y;//相对容器鼠标位置
				//判断是否超越容器大小
				if(offsetY > player.volume.options.volHeight || offsetY < 0){
					return;
				}

				player.volume.options.$dragging.css('top',offsetY);//设置音量游标位置
				$volumeProgressCurrent.css('top',offsetY);//设置音量进度条位置
				soundManager.setVolume(soundId,100 - (offsetY / player.volume.options.volHeight * 100));//设置音量
			}
		},
		up:function(){
			if(player.volume.options.$dragging != null){
				$volumePanel.fadeOut();
				player.volume.options.$dragging = null;

				//注销事件，释放内存
				$(document).unbind('mousemove');
				if(player.volume.options.timer) clearTimeout(player.volume.options.timer);
				player.volume.options.timer = setTimeout(function(){
					$(document).mousemove(player.volume.move);
				},100);
			}
		},
		//获取事件对象
		getEvent:function(event){
			return event ? event : window.event;
		},
		//获取滚动条的距离
		getScrollXY:function(){
			return {'x':(document.body.scrollLeft || document.documentElement.scrollLeft),'y':(document.body.scrollTop || document.documentElement.scrollTop)};
		},
		//获取鼠标位置
		getPageXY:function(event){
			var event = player.volume.getEvent(event),
			pageX = event.pageX,
			pageY = event.pageY,
			scrollXY = player.volume.getScrollXY();

			if(pageX === undefined){
				pageX = event.clientX + scrollXY.x;
				pageY = event.clientY + scrollXY.y;
			}
			return {'x':pageX,'y':pageY};
		},
		//获取元素和鼠标位置之间的差值（解决鼠标总是在元素左上角的问题）
		getDiffXY:function(obj,event){
			player.volume.options.pageXY = player.volume.getPageXY(event);
			player.volume.options.offsetXY = player.volume.getAbsPos(obj);
			return {'x':player.volume.options.pageXY.x - player.volume.options.offsetXY.x,'y':player.volume.options.pageXY.y - player.volume.options.offsetXY.y};
		},
		//获取元素跟随鼠标的位置
		getDragXY:function(event){
			return {'x':player.volume.options.pageXY.x - player.volume.options.diffXY.x,'y':player.volume.options.pageXY.y - player.volume.options.diffXY.y};
		},
		//获取元素相对视窗的绝对位置
		getAbsPos:function(obj){
			var offsetX = obj.offsetLeft,
			offsetY = obj.offsetTop,
			current = obj.offsetParent;
			while(current !== null){
				offsetX+= current.offsetLeft;
				offsetY+= current.offsetTop;
				current = current.offsetParent;
			}
			return {'x':offsetX,'y':offsetY};
		}
    };

	//播放暂停显隐
	function togglePlay(flag){
		//如果正在播放，则返回
		if(!$pauseBtn.hasClass(player.css.vs) && flag){
			return;
		}

		if(!$playBtn.hasClass(player.css.vs)){
			$playBtn.toggleClass(player.css.vs);
			$pauseBtn.toggleClass(player.css.vs);
			player.sound.play();
		}else{
			$playBtn.toggleClass(player.css.vs);
			$pauseBtn.toggleClass(player.css.vs);
			player.sound.pause();
		}
	}

	player.init();
})(jQuery,window);
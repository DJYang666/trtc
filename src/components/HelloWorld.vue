<template>
	<div>
		<!--视频组件容器-->
    <div class="content">
    	<!--左边成员列表名单-->
      <div class="left">
      	<div id="warp" class="userlist">
      		<!--本地流-->
        	<div id='local_stream' @click="switchMain"></div>
          <div id='mask' class="maskable" v-show="!isVedio"></div>
      	</div>
      	<!--远端流-->
      	<div class="userlist"  v-for="item in list"  :class="{active: activeId==item.id}" @click="activeId=item.id">
        	<div :id="item.id" class="distant-stream" v-html="item.remoteStream" @click="getVideo(item.id)"></div>
      	</div>
      </div>
      <!--右边视频盒子-->
      <div class="right">
      	<!--相关的操作-->
        <div class="operator">
          <div class="item" @click="muteLocalAudio">
          	<div class="img-warp">
          		<img id="audio" class="img" src="../../static/images/01语音@2x.png" alt="语音" v-show="isAudio"/>
          		<img id="unaudio" class="img" src="../../static/images/06取消静音@2x.png" alt="语音" v-show="!isAudio"/>
          	</div>
            <span>{{ isAudio ? '静音' : '取消静音' }}</span>
          </div>
          <div class="item" @click="muteLocalVideo">
          	<div class="img-warp">
          		<img class="img" src="../../static/images/02视频@2x.png" alt="视频" v-show="isVedio"/>
          		<img class="img" src="../../static/images/07打开摄像头@2x.png" alt="视频" v-show="!isVedio"/>
          	</div>
            <span>{{ isVedio ? '关闭摄像头' : '打开摄像头' }}</span>
          </div>
          <div class="item">
          	<div class="img-warp">
          		<img class="img" src="../../static/images/04挂断@2x.png" alt="离开会议"/>
          	</div>
            <span>离开会议</span>
          </div>
        </div>
      </div>
    </div>
	</div>
</template>

<script>
import LibGenerateTestUserSig from '../../static/js/lib-generate-test-usersig.min.js'
import $ from '../../static/js/jquery-3.2.1.min.js'
import TRTC from 'trtc-js-sdk'
export default {
  data () {
    return {
    	activeId: '', // 当前视频的播放id
      list: [], // 远端流列表
      userId: '李易峰_'+Math.floor(Math.random()*100), // 用户id --可更改
      roomId: 888888, // 房间号--加入相同房间才能聊
      client: '', // 客户端服务
      remoteStream: '', // 远方播放流
      localStream: '', // 本地流,
      isVedio: true, // 当前是否打开摄像头
      isAudio: true, // 当前是否打开麦克风
      members_: new Map(), // 成员
      isHave: false, //当前列表是否有该成员
    }
  },
  computed: {
  	getDay () {
  		return {
  			0: '星期日',
  			1: '星期一',
  			2: '星期二',
  			3: '星期三',
  			4: '星期四',
  			5: '星期五',
  			6: '星期六'
  		}
  	}
  },
  mounted () {
    this.list = []
    this.createClient(this.userId)
  },
  methods: {
  	// 将自己切换到主视频
  	switchMain () {
  		if ($('#local_stream').hasClass('mainVedio')) { return }
  		$('.mainVedio').removeClass('mainVedio').parent().removeClass('active')
      $('#local_stream').addClass('mainVedio')
      $('#warp').addClass('active')
  	},
  	getVideo (id) {
  		if ($('#' + id).hasClass('mainVedio')) { return }
  		$('.mainVedio').removeClass('mainVedio').parent().removeClass('active')
      $('#' + id).addClass('mainVedio').css({'height':'93%'}).parent().addClass('active')
  	},
    close () {
  		this.isVedio = true
  		this.isAudio = true
      this.isShow = false
      this.$emit('close')
    },
    // 创建链接
    createClient (userId) {
      // 获取签名
      const config = this.genTestUserSig(userId)
      const sdkAppId = config.sdkAppId
      const userSig = config.userSig
      this.client = TRTC.createClient({
        mode: 'rtc',
        sdkAppId,
        userId,
        userSig
      })
      // 初始化后才能加入房间
      this.joinRoom()
    },
    // 加入房间
    async joinRoom () {
      await this.client.join({ roomId: this.roomId })// Number(this.videoInfo.roomNumber)
        .then(() => {
          // 创建本地流
          this.createStream()
          // 播放远端流
          this.playStream()
        })
        .catch((error) => {
          console.error('进房失败 ' + error)
        })

      // 注册远程监听，要放在加入房间前--这里用了发布订阅模式
      this.subscribeStream()
    },
    // 创建本地音视频流
    createStream () {
      this.localStream = TRTC.createStream({ userId: this.userId, audio: true, video: true })

      this.localStream.initialize().then(() => {
        console.log('初始化本地流成功')
        // 创建好后才能播放 本地流播放 local_stream 是div的id
        this.localStream.play('local_stream')
        $('<div>').addClass('info')
          .text(this.userId + '(我)')
          .appendTo($('#warp'))
          .css({
			  	'width': '100%',
			  	'height': '20%',
			  	'line-height': '35px',
			  	'color': '#fff',
			  	'background': '#3c3d40',
  				'display': 'flex',
  				'align-items': 'center',
  				'z-index': '99',
  				'margin-top': 'auto'
			  })
        this.$nextTick(() => {
		        // 创建好后才能发布
		        this.publishStream()
        })
        this.updateStream()
      })
        .catch((error) => {
          console.error('初始化本地流失败 ' + error)
        })
    },
    // 发布本地音视频流
    publishStream () {
      this.client
        .publish(this.localStream)
        .catch((error) => {
          console.error('本地流发布失败 ' + error)
        })
        .then(() => {
        	$('#local_stream').addClass('mainVedio').parent().addClass('active')
          console.log('本地流发布成功')
        })
    },
    // 远端监听
    updateStream () {
    	this.client.on('stream-removed', (event) => {
			  const remoteStream = event.stream
			  $(`${'#mask_' + remoteStream.getId()}`).hide()
			  $(`${'#status_' + remoteStream.getId()}`).show()
      })
      // 关闭摄像头
	    this.client.on('mute-video', (evt) => {
      	let streamId = this.getUidByStreamId(evt.userId)
	      if (streamId) {
	        $('#mask_' + streamId).show()
	      }
	    })
      // 打开摄像头
	    this.client.on('unmute-video', (evt) => {
      	let streamId = this.getUidByStreamId(evt.userId)
	      if (streamId) {
	        $('#mask_' + streamId).hide()
	      }
	    })
      // 关闭语音
	    this.client.on('mute-audio', (evt) => {
      	let streamId = this.getUidByStreamId(evt.userId)
      	$(`${'#user_' + streamId}`).find('#audio_' + streamId).hide().next().show()
	    })
      // 打开语音
	    this.client.on('unmute-audio', (evt) => {
      	let streamId = this.getUidByStreamId(evt.userId)
      	$(`${'#user_' + streamId}`).find('#unaudio_' + streamId).hide().prev().show()
	    })
    },
    // 根据id获取uid
	  getUidByStreamId (streamId) {
	    for (let [uid, stream] of this.members_) {
	      if (stream.getUserId() == streamId) {
	        return uid
	      }
	    }
	  },
    // 订阅远端流--加入房间之前
    subscribeStream () {
      this.client.on('stream-added', (event) => {
        const remoteStream = event.stream
    		this.isHave = false
		    for (let [uid, stream] of this.members_) {
		    	if (stream.getUserId() === remoteStream.getUserId()) {
	        	$('#user_' + stream.getId()).remove()
		    		this.members_.delete(stream.getId())
        		this.isHave = true
		    	}
		    }
		    this.members_.set(remoteStream.getId(), remoteStream)
        console.log('远端流增加: ', remoteStream.getUserId())
        // 订阅远端流
        this.client.subscribe(remoteStream)
      })
    },

    // 播放远端流
    playStream () {
      this.client.on('stream-subscribed', (event) => {
        const remoteStream = event.stream
        console.log('远端流订阅成功：' + remoteStream.getId())
        // 创建远端流标签，因为id是动态的，所以动态创建，用了v-html

      	const id = remoteStream.getId()
        this.remoteStream = `<view id="${'remote_stream-' + id}" style="width:100%;height:100%"></view>`
        if (!this.isHave) {
	        this.list.push({
	        	id,
	        	userId: remoteStream.getUserId(),
	        	remoteStream: this.remoteStream,
	        	origin: remoteStream
	        })
        } else {
	        this.list.splice(this.list.findIndex((v) => v.userId === remoteStream.getUserId()), 1, {
	        	id,
	        	userId: remoteStream.getUserId(),
	        	remoteStream: this.remoteStream,
	        	origin: remoteStream
	        })
        }
        // 做了dom操作 需要使用$nextTick(),否则找不到创建的标签无法进行播放
        this.$nextTick(() => {
          // 播放
          remoteStream.play('remote_stream-' + id)
          let audio = $('#audio').clone()
          audio.attr('id', 'audio_' + id)
          audio.css({    
          	'width': '14px',
    				'height': '21px',
    				'background': 'none',
    				'margin-left': 'auto'
    			})
          let unaudio = $('#unaudio').clone()
          unaudio.attr('id', 'unaudio_' + id)
          unaudio.css({    
          	'width': '14px',
    				'height': '21px',
    				'background': 'none',
    				'margin-left': 'auto'
    			})

		      let mask = $('#mask').clone()
		      mask.text('')
		      mask.attr('id', 'mask_' + id)
		      mask.css({
		      	'width': '100%',
		      	'height': '100%',
		      	'text-align': 'center',
		      	'z-index': '99'
		      })
		      mask.appendTo($('#player_' + id))
		      mask.hide()

		      let status = $('<div>', {
		      	id: 'status_' + id
		      })
		      status.css({
		      	'width': '100%',
		      	'height': '100%',
		      	'text-align': 'center',
		      	'color': '#fff',
    				'display': 'flex',
    				'align-items': 'center',
    				'justify-content': 'center'
		      })
		      status.html('<span>已离开会议<span>')
		      status.appendTo($('#player_' + id))
		      status.hide()
					console.log(4198649, $('#audio').clone())
		      $('#player_' + id).css({'position': 'relative'})
				  let bottom = $('<div/>', {id: 'user_' + id})
				  bottom.html(`<span style="white-space: nowrap;text-overflow: ellipsis;overflow: hidden;">${remoteStream.getUserId()}</span>`)
				  bottom.css({
				  	'width': '100%',
				  	'height': '20%',
				  	'line-height': '35px',
				  	'color': '#fff',
				  	'background': '#3c3d40',
    				'display': 'flex',
    				'align-items': 'center',
    				'z-index': '99',
    				'margin-top': 'auto'
				  })
				  audio.appendTo(bottom)
				  unaudio.appendTo(bottom)
		      bottom.appendTo($('#' + id).parent())
        })
      })
    },
    async closeRoom () {
    	await this.client.unpublish(this.localStream)

	    // leave the room
	    await this.client.leave()
	    this.localStream.stop()
	    this.localStream.close()
	    this.localStream = null
	    // this.isJoined_ = false;
      $('#local_stream').parent()
        .children('.info')
        .remove()
    },
    // 获取用户签名--前端测试用
    genTestUserSig (userID) {
      const SDKAPPID = 1400419566
      const EXPIRETIME = 604800
      const SECRETKEY =
        'c950d8f01b2b2742ead4e1bf9da553bab88f9ba4ac0c8ce4b9b30071e6098d27'

      // a soft reminder to guide developer to configure sdkAppId/secretKey
      if (SDKAPPID === '' || SECRETKEY === '') {
      	return false
      }
      const generator = new LibGenerateTestUserSig(SDKAPPID, SECRETKEY, EXPIRETIME)
      const userSig = generator.genTestUserSig(userID)
      return {
        sdkAppId: SDKAPPID,
        userSig: userSig
      }
    },
    // 关闭/打开摄像头
    muteLocalVideo () {
    	if (this.isVedio) {
    		this.isVedio = false
    		this.localStream.muteVideo()
    	} else {
    		this.isVedio = true
    		this.localStream.unmuteVideo()
    	}
    },
    // 关闭/打开麦克风
    muteLocalAudio () {
    	if (this.isAudio) {
    		this.isAudio = false
    		this.localStream.muteAudio()
    	} else {
    		this.isAudio = true
    		this.localStream.unmuteAudio()
    	}
    },
    closeAddPersonRes (arr = []) {
    	this.isAddPerson = false
    }
  }
}
</script>

<style scoped lang="less">
* {
  font-size: 18px;
}
.content {
	width: 100vw;
  height: 100vh;
  background: #2b2222;
  display: flex;
  padding: 10px;

  .left {
    width: 450px;
    height: 900px;
    display: flex;
    overflow-y: auto;
    background: #3d3b3b;
    align-content: flex-start;
    margin-bottom: 10px;
    flex-wrap: wrap;
    .userlist{
      width: 190px;
      height: 165px;
      border-radius: 1px;
      margin-top: 10px;
      border: 1px solid #2a2e32;
      position: static;
      display: flex;
      flex-direction: column;
      margin-top: auto;
		  background: url(../../static/images/lyf.jpg) no-repeat;
		  background-position: center 0px;
		  background-size: 100%;

			&:nth-child(2n){
				margin-left: 6px;
			}

      p {
        color: #fff;
        font-size: 14px;
        text-align: center;
      }
      .img {
        width: 100%;
        height: 130px;
        background: #fff;
      }

      &.active {
        border: 1px solid #fff;
      }
    }
  }

  .right {
    width: calc(~'100vw - 210px');
    height: calc(100vh - 69px);
    background-color: #3d3b3b;
    border-radius: 1px;
    margin: 0 10px 10px 10px;
    padding: 0 10px;

    .container {
      width: 100%;
      height: 820px;
      background: #191f24;

      video {
      	height: 100% !important;
      }
    }
		.maskshow {
			display: block;
		}
    .operator {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      text-align: center;
      position: absolute;
	    bottom: 40px;
	    left: 50%;

      .item {
        display: flex;
        flex-direction: column;
        width: 80px;

				&:nth-child(1) .img-warp .img{
					width: 23px;
				}
				&:nth-child(2) .img-warp .img{
					width: 40px;
				}

				&:nth-child(3) .img-warp{
					background: #e63517;

					.img {
						width: 44px;
					}
				}

				.img-warp {
					width: 100%;
					height: 45px;
					text-align: center;
					line-height: 45px;
					background: #E3E3E3;
					border-radius: 10px;
					position: relative;
					.img {
						position: absolute;
				    left: 50%;
				    top: 50%;
				    transform: translate(-50%, -50%);
					}
				}

        &:not(:first-child) {
          margin-left: 20px;
        }

        .item-icon {
          width: 80px;
          height: 45px;
          line-height: 45px;
          background-color: #e3e3e3;
          border-radius: 10px;
        }

        span {
          font-size: 16px;
          text-align: center;
          color: #fff;
          margin-top: 10px;
        }
      }
    }
  }
}
.distant-stream {
  width: 100%;
  height: 100%;
}
.footer{
  display:flex;
  justify-content:center;
  background: #fff;

  .btn{
    width: 140px;
    height: 40px;
    background-color: #ffffff;
    border-radius: 4px;
    border: solid 1px #e3e3e3;
    line-height: 40px;
    text-align: center;
    justify-content: center;
    user-select: none;
    cursor: pointer;

    &:not(:first-child) {
      margin-left: 20px;
      background: #1e8ef4;
      color: #fff;
    }

    &:nth-child(2) {
      background: #e63517;
      color: #fff;
    }

    &:last-child {
      border: solid 1px #e63517;
      background: #fff;
      color: #e63517;
    }
  }
}
#local_stream {
	width: 100%;
	height: 93%;
}
.info {
	width: 100%;
  height: 20%;
  line-height: 35px;
  color: rgb(255, 255, 255);
  background: rgb(60, 61, 64);
  position: absolute;
  bottom: 0px;
  display: flex;
  align-items: center;
  z-index: 99;
}
.mainVedio {
  position: absolute;
  width: calc(100% - 430px) !important;
  right: 20px;
}
#warp, #user-warp{
  display: flex;
  flex-direction: column;
}

.maskable{
	position: absolute;
  width: calc(~'100% - 410px');
  right: 0px;
  height: 80%;
  color: #fff;
  text-align: center;
  line-height: 900px;
  background: url(../../static/images/08摄像头已关闭@2x.png) center no-repeat;
}

.active{
	border: 1px solid #fff;
}
</style>
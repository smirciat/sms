'use strict';

(function() {

  class MainController {
    
    constructor($http, $scope, $timeout,socket, moment, Auth, webNotification, $window) {
      this.$http = $http;
      this.socket = socket;
      this.$scope=$scope;
      this.$timeout=$timeout;
      this.$window=$window;
      this.awesomeThings = [];
      this.Auth=Auth;
      this.isAdmin = Auth.isAdmin;
      this.moment=moment;
      this.webNotification=webNotification;
      this.showing=false;
      this.zoomed=false;
      this.sending=false;
      
      $scope.$on('$destroy', function() {
        socket.unsyncUpdates('thing');
        socket.unsyncUpdates('sm');
      });
      this.sms = {};
      this.sms.autoSMS=false;
      this.sms.multiple=[];
      this.sms.to='+1';
      this.sms.body="";
      this.sms.mediaUrl="";      
      this.newSms = "btn btn-default";//or "button-flashing";
      this.messages=[];
      this.names=[];
      this.nameArr=[];
      this.phone='';
      this.id='';
    }

    $onInit() {
      this.Auth.getCurrentUser((user)=>{
        this.phone=user.phone;
        this.id=user._id;
        this.refresh("");
      });
      
      this.loginTimeout=this.$timeout(function(){
        window.location.reload();
      },14*60*60*1000);
      this.$http.get('/api/things')
          .then(response => {
            this.awesomeThings = response.data;
          this.socket.syncUpdates('thing', this.awesomeThings);
        });
    }

    addThing() {
      if (this.newThing) {
        this.$http.post('/api/things', {
          name: this.newThing
        });
        this.newThing = '';
      }
    }

    deleteThing(thing) {
      this.$http.delete('/api/things/' + thing._id);
    }
    
    class(message){
      if (message.to===this.phone||message.to==='+19073022700') return 'danger';
      else return "success";
    }
    
    img(){
      if (this.imgSrc&&this.imgSrc!=="") return true;
      else return false;
    }
    
    blobToBase64(blob) {
      return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
    
    paste(event){
      var URLObj = window.URL || window.webkitURL;
      var blob=null;
      var filename="";
      this.imgSrc = "";
      var items=event.originalEvent.clipboardData.items;
      for (var i=0;i<items.length;i++){
        //console.log(items[i].type);
        if (items[i].type.substring(0,5)==="image") {
         blob=event.originalEvent.clipboardData.items[i].getAsFile();
         //this.imgSrc = URLObj.createObjectURL(blob);
         filename = new Date().getTime().toString() + '.png';
         this.blobToBase64(blob).then((result)=>{
           this.$http.post('/api/sms/image',{blob:result, filename:filename}).then((res)=>{
             //https://beringair.xyz:58785/png?filename=1647205300778.png or https://bering-reservations.s3.us-west-2.amazonaws.com/images/
              console.log(res);
              this.imgSrc='/png?filename=' + filename;
              this.sms.mediaUrl = 'https://beringair.xyz:58785/png?filename=' + filename;
            },
            (err)=>{console.log(err)});
          });
          break;
        }
      }
      
     
    }
    
    undo(){
      this.$timeout.cancel(this.alltimeout);
    }
    
    newMessage(name){
      if (name.isNew) return "blue-background";
    }
     
     showButtons(name){
       if (name.expanded) return true;
       else if (this.zoomed) return false;
       return true;
     }
    
    toggle(name){
      var foundIndex = this.nameArr.findIndex(x => x.name === name.name);
      this.nameArr[foundIndex].isNew = false;
      this.nameArr[foundIndex].expanded = !this.nameArr[foundIndex].expanded;
      this.reply(this.nameArr[foundIndex].messages[0]);
      this.$timeout(()=>{
        if (name.expanded) {
          this.zoomed=true;
          this.nameArr.forEach((n)=>{
            n.hidden=true;
          });
          this.nameArr[foundIndex].hidden=false;
        }
        else {
          this.zoomed=false;
          this.nameArr.forEach((n)=>{
            n.hidden=false;
          });
        }
        
      },0);
      //this.zoomed=!this.zoomed;
    }
    
    setNumber(phone){
      this.undo();
      this.refresh(phone);
      var timeout=function(){
        if (phone!=="") {
          alert('Don`t forget to select `All` from `See Only One Conversation`');
        }
      };
      this.alltimeout=this.$timeout(timeout,60000);
    }
    
    refresh(number){
      this.nameArr=[];
      if (number===null) number="";
      this.$http.post('/api/smsNames/mine',{id:this.id}).then((response)=>{
        this.names=response.data.sort((a,b)=>{
          return a.name.localeCompare(b.name);
        });
        
        this.$http.post('/api/sms/all',{phone:this.phone}).then((response)=>{
          response.data=response.data.filter(sm=>{
            //return !sm.autoSMS&&sm.from;
            return sm.from;
          });
          if (number==="") this.messages=response.data;
          else {
            this.messages=response.data.filter(sm=>{
              return sm.to===number||sm.from===number;
            });
          }
          
          this.resort(undefined);
          
          this.names.unshift({name:'All',phone:''});
          this.socket.unsyncUpdates('sm');
          this.socket.syncUpdates('sm', this.messages, (event, item, array)=>{
            //if item doesn't have this.phone, take it out of this.messages
            if (item.from!==this.phone&&item.to!==this.phone) {
              this.messages=this.messages.filter((message)=>{
                return message._id!==item._id;
              });
              return;
            }
            var from=item.from;
            var namesFrom = this.names.filter((name)=>{
              return name.phone===item.from;
            });
            if (namesFrom.length>0) from = namesFrom[0].name;
                 if (event==='created'&&item.from!==this.phone&&item.from!='+19074855026') {
                   //var showing=false;
                   this.webNotification.showNotification('New SMS Message', {
                        body: 'From: ' + from + '\nMsg: ' + item.body,
                        icon: '../assets/images/Icon-512.png',
                        onClick: function onNotificationClicked() {
                            //showing=true;
                            console.log('Notification clicked.');
                        },
                        requireInteraction: true   
                        //autoClose: 6000000 //auto close the notification after 4 seconds (you can manually close it via hide function)
                    }, function onShow(error, hide) {
                        if (error) {
                            window.alert('Unable to show notification: ' + error.message);
                        } else {
                            console.log('Notification Shown.' + from);
                            if (from==='+19074855026') hide();
        
                            //var int=setInterval(function hideNotification() {
                                //console.log('Hiding notification....');
                            //    console.log( showing);
                            //    if ( showing) {
                            //      hide();
                            //       showing=false;
                            //      clearInterval(int); 
                            //    }
                                //hide(); //manually close the notification (you can skip this if you use the autoClose option)
                            //}, 10*1000);
                        }
                    });
    
                 }
             
             this.resort(item);
          });
        });
      });
    }
    
     resort(item){
          this.insertNames();
          
          var matchTo,matchFrom=false;
          this.messages.forEach(message=>{
            //only display twilio hosted images, delete this line if you change your mind
            if (message.mediaUrl&&message.mediaUrl.substring(12,18)!=='twilio') message.mediaUrl='';
            matchTo=matchFrom=false;
            this.names.forEach(name=>{
              if (name.phone===message.to) matchTo=true;
              if (name.phone===message.from) matchFrom=true;
            });
            if (!matchTo) this.names.push({name:message.to,phone:message.to});
            if (!matchFrom) this.names.push({name:message.from,phone:message.from});
          });
          
          var tempNameArr=[];
          this.names.forEach((name)=>{
            var messagesMatch = this.messages.filter(sm=>{
              return sm.to===name.phone||sm.from===name.phone;
            });
            
            messagesMatch.sort((a,b)=>{
              return a._id-b._id;
            }); 
            //messagesMatch=messagesMatch.reverse();
            var expanded = false;
            var hidden = false;
            var isNew=false;
            if (this.zoomed) hidden=true;
            //console.log(this.nameArr)
            var foundIndex=this.nameArr.findIndex(x=>x.name.name===name.name);
            if (foundIndex!==-1) {
              expanded=this.nameArr[foundIndex].expanded;
              if (expanded) hidden=false;
              isNew=this.nameArr[foundIndex].isNew;
              if (this.nameArr[foundIndex].name.phone===item.to||this.nameArr[foundIndex].name.phone===item.from) isNew=true;
            }
            if (name.name!=="Bering Air"&&messagesMatch.length>0) tempNameArr.push({name:name,messages:messagesMatch,expanded:expanded,hidden:hidden,isNew:isNew});
          });
          
          tempNameArr.sort((a,b)=>{
            if (!a||!a.messages||a.messages.length===0) return -1;
            if (!b||!b.messages||b.messages.length===0) return 1;
            return -a.messages[(a.messages.length-1)]._id + b.messages[(b.messages.length-1)]._id;
          });
          
          this.nameArr=tempNameArr;
     }
     
     send(){
      this.sending=true;
      this.sms.sent = this.moment().toDate();
      this.sms.from=this.phone;
      switch (this.sms.to.length){
        case 7: this.sms.to = '+1907' + this.sms.to;
            break;
        case 10: this.sms.to = '+1' + this.sms.to;
            break;
        case 11: this.sms.to = '+' + this.sms.to;
            break;
        default: break;
      }
      if (this.sms.to&&this.sms.to.length>6&&(this.sms.body||this.sms.mediaUrl)) {
        //console.log(this.sms)
        this.$http.post('/api/sms/twilio',this.sms).then((res)=>{
          //this.refresh("");
          this.sms = {};
          this.sms.to='+1';
          this.sms.autoSMS=false;
          this.sms.multiple=[];
          this.sms.body="";
          this.sms.mediaUrl="";
          this.imgSrc="";
          this.sending=false;
        },(err)=>{
          console.log(err);
          alert('Error sending SMS through Twilio! \r\n' + err.data);
          this.sending=false;
          });
      }
      else {
        alert("Check that you have a message to send first!");
        this.sending=false;
      }
    }
    
    insertNames(){
      this.messages.forEach((message)=>{
        var namesFrom = this.names.filter((name)=>{
          return name.phone===message.from;
        });
        var namesTo = this.names.filter((name)=>{
          return name.phone===message.to;
        });
        message.fromName = message.from;
        message.toName = message.to;
        if (namesFrom.length>0) message.fromName = namesFrom[0].name;
        if (namesTo.length>0) message.toName = namesTo[0].name;
      });
    }
    
    addName(name,phone){
      if (phone&&name&&phone!==""&&name!=="") {
        this.$http.post('/api/smsNames',{name:name,phone:phone}).then((response)=>{
          this.refresh("");
        });
      }
    }
    
    reply(message){
      var from = message.from;
      if (from===this.phone) from=message.to;
      this.sms.to=from;
    }
    
    timeout(){
        this.refresh();
    }
    
    openMedia(message){
      if (!message) message={mediaUrl:this.imgSrc};
      this.$window.open(message.mediaUrl, '_blank');
    }
    
    clickMultiple(){
      if (this.sms.autoSMS) {
        this.sms.multiple=angular.fromJson(this.$window.localStorage.getItem("includedNames"));
        this.sms.to="Multiple";
      }
      else {
        this.sms.multiple=[];
        this.sms.to="+1";
      }
      //this.$timeout(()=>{console.log(this.sms.multiple)},0);
    }
  }

  angular.module('newsimpleApp')
    .component('main', {
      templateUrl: 'app/main/main.html',
      controller: MainController
    });
})();

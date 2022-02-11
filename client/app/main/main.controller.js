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
      this.isAdmin = Auth.isAdmin;
      this.moment=moment;
      this.webNotification=webNotification;
      
      $scope.$on('$destroy', function() {
        socket.unsyncUpdates('thing');
        socket.unsyncUpdates('sm');
      });
      this.sms = {};
      this.sms.to='+1';
      this.sms.body="";
      
      this.newSms = "btn btn-default";//or "button-flashing"
      this.messages=[];
      this.names=[];
      this.refresh("");
    }

    $onInit() {
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
      if (message.to==='+12694423187'||message.to==='+19073022700') return 'danger';
      else return "success";
    }
    
    setNumber(phone){
      this.$timeout.cancel(this.alltimeout);
      this.refresh(phone);
      var timeout=function(){
        if (phone!=="") {
          alert('Don`t forget to select `All` from `See Only One Conversation`');
        }
      };
      this.alltimeout=this.$timeout(timeout,60000);
    }
    
    refresh(number){
      if (number===null) number="";
      this.$http.get('/api/smsNames').then((response)=>{
        this.names=response.data.sort((a,b)=>{
          return a.name.localeCompare(b.name);
        });
        this.names.unshift({name:'All',phone:''});
        this.$http.post('/api/sms/all').then((response)=>{
          response.data=response.data.filter(sm=>{
            return !sm.autoSMS;
          });
          if (number==="") this.messages=response.data;
          else {
            this.messages=response.data.filter(sm=>{
              return sm.to===number||sm.from===number;
            });
          }
          this.insertNames();
          this.socket.unsyncUpdates('sm');
          this.socket.syncUpdates('sm', this.messages, (event, item, array)=>{
             console.log(event);
             console.log(item);
             this.insertNames();
             var from = item.fromName||"";
             if (!from||from==="") from=item.from;
                 if (event==='created'&&item.from!=='+12694423187') {
                   this.webNotification.showNotification('New SMS Message', {
                        body: 'From: ' + from + ' Msg: ' + item.body,
                        icon: '../assets/images/Icon-512.png',
                        onClick: function onNotificationClicked() {
                            console.log('Notification clicked.');
                        },
                        requireInteraction: true   
                        //autoClose: 6000000 //auto close the notification after 4 seconds (you can manually close it via hide function)
                    }, function onShow(error, hide) {
                        if (error) {
                            window.alert('Unable to show notification: ' + error.message);
                        } else {
                            console.log('Notification Shown.');
        
                            setTimeout(function hideNotification() {
                                console.log('Hiding notification....');
                                //hide(); //manually close the notification (you can skip this if you use the autoClose option)
                            }, 60000000);
                        }
                    });
    
                 }
             array.sort((a,b)=>{
               return this.moment(b.sent).diff(this.moment(a.sent));
             });
          });
        });
      });
    }
    
     send(){
      this.sms.sent = this.moment().toDate();
      switch (this.sms.to.length){
        case 7: this.sms.to = '+1907' + this.sms.to;
            break;
        case 10: this.sms.to = '+1' + this.sms.to;
            break;
        case 11: this.sms.to = '+' + this.sms.to;
            break;
        default: break;
      }
      if (this.sms.body&&this.sms.to&&this.sms.to.length>6&&this.sms.body.length>3) {
        this.$http.post('/api/sms/twilio',this.sms).then((res)=>{
          this.refresh("");
          this.sms = {};
          this.sms.to='+1';
          this.sms.body="Message from Bering Air Dispatch, Reply to this number. ";
        },(err)=>{console.log(err)});
      }
      else {
        alert("check that you have a message to send first!");
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
      if (from==="+12694423187") from=message.to;
      this.sms.to=from;
    }
    
    timeout(){
        this.refresh();
    }
    
    openMedia(message){
      this.$window.open(message.mediaUrl, '_blank');
    }
    
  }

  angular.module('newsimpleApp')
    .component('main', {
      templateUrl: 'app/main/main.html',
      controller: MainController
    });
})();

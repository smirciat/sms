'use strict';

(function(){

class PhoneNameComponent {
  constructor($scope,$http,socket,Auth) {
    this.$scope=$scope;
    this.$http=$http;
    this.socket=socket;
    this.names=[];
    this.newName={};
    this.Auth=Auth;
    this.id='';
    
  }
  
  $onInit() {
    this.getNames();
  }
  
  getNames(){
    this.Auth.getCurrentUser((res)=>{
      this.id=res._id;
      this.$http.post('/api/smsNames/mine',{id:this.id}).then((response)=>{
        this.names=response.data.sort(function(a,b){
          return a.name.localeCompare(b.name);
        });
        //console.log(this.names);
      });
    });  
  }
  
  addName(){
      if (!this.newName.name) return;
      if (!this.newName.phone) return;
      this.newName.owner = this.id;
      this.$http.post('/api/smsNames',this.newName).then((response)=>{
        this.getNames();
        this.newName={};
      });
  }
  
  deleteName(name){
    this.$http.delete('/api/smsNames/'+name._id).then((response)=>{
      this.getNames();
    });
  }
}

angular.module('newsimpleApp')
  .component('phoneName', {
    templateUrl: 'app/phoneName/phoneName.html',
    controller: PhoneNameComponent,
    controllerAs: 'phoneNameCtrl'
  });

})();

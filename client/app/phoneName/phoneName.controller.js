'use strict';

(function(){

class PhoneNameComponent {
  constructor($scope,$http,socket) {
    this.$scope=$scope;
    this.$http=$http;
    this.socket=socket;
    this.names=[];
    this.newName={};
    
    
    
  }
  
  $onInit() {
    this.getNames();
  }
  
  getNames(){
      this.$http.get('/api/smsNames').then((response)=>{
        this.names=response.data.sort(function(a,b){
          return a.name.localeCompare(b.name);
        });
        console.log(this.names);
      });
  }
  
  addName(){
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

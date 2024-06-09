'use strict';

(function(){

class PhoneNameComponent {
  constructor($scope,$http,socket,Auth,$window) {
    this.$scope=$scope;
    this.$http=$http;
    this.socket=socket;
    this.includedNamesArr=[];
    this.names=[];
    this.newName={};
    this.Auth=Auth;
    this.$window=$window;
    this.id='';
    
  }
  
  $onInit() {
    this.getNames();
  }
  
  removeDuplicates(){
      var soFar=[];
      var index;
      this.names.forEach(name=>{
        index=soFar.map(e => e.phone).indexOf(name.phone);
        if (index&&index>=0) {
          console.log('duplicate');
        }
        else {
          soFar.push(name);
        }
      });
      this.names=soFar;
    }
  
  getNames(){
    this.Auth.getCurrentUser((res)=>{
      this.id=res._id;
      this.$http.post('/api/smsNames/mine',{id:this.id}).then((response)=>{
        this.names=response.data.sort(function(a,b){
          return a.name.localeCompare(b.name);
        });
        this.removeDuplicates();
        this.includedNamesArr = angular.fromJson(this.$window.localStorage.getItem("includedNames"));
        this.names.forEach((name)=>{
          this.includedNamesArr.forEach((includedName)=>{
            if (name._id===includedName._id) name.include=true;
          });
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
  
  clicked(){
    //console.log(this.names);
    var array=this.names.filter((name)=>{
      return name.include && name.phone!=="+12694423187";
    });
    this.$window.localStorage.setItem('includedNames',angular.toJson(array));
    
  }
}

angular.module('newsimpleApp')
  .component('phoneName', {
    templateUrl: 'app/phoneName/phoneName.html',
    controller: PhoneNameComponent,
    controllerAs: 'phoneNameCtrl'
  });

})();

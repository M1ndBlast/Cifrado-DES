window.onload=function(){

var uploadField = document.getElementById("file");

uploadField.onchange = function() {
    if(this.files[0].size > 307200){
       alert("Pls, meta un archivo mas pequeño :c");
       this.value = "";
    };
};

    }

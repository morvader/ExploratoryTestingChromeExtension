function loadData(data){
        //var p = document.getElementById("data");
        //p.innerHTML += "<br>data received: " + data;
        //alert(data);
        var html = document.getElementsByTagName("html")[0];
        html.innerHTML = data;
}
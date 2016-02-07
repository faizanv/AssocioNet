var width;
var height;

var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();


createHiDPICanvas = function(w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var can = document.createElement("canvas");
    can.id = "myCanvas";
    width = w;
    can.width = w * ratio;
    height = h;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}

function changeCurrentNode(node, template) {
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    // console.log({currentNode : $scope.currentNode, template : $scope.template});
    var neighbors = getNeighbors(node, template);
    console.log({neighbors : neighbors, this: node});
    context.font = "30px Arial";
    context.textAlign="center"; 
    drawNeighbors(context, neighbors);
    drawCurrentWord(context, node);
}

drawCurrentWord = function(context, node) {
    rect_w = 200;
    rect_h = height / 4;
    var x = (width - rect_w) / 2;
    var y = (height - rect_h) * 3/4;
    context.font = "30px Helvetica Nue, Helvetica, Arial";
    context.textAlign="center"; 
    // context.fillStyle = "#3498db";
    context.strokeStyle = "#3498db";
    context.textBaseline = 'middle';
    // context.fillRect((width - rect_w) / 2 , height * 2/3 , rect_w, rect_h);
    context.strokeRect(x, y , rect_w, rect_h);
    context.fillStyle = "#2c3e50";
    context.fillText(fittingString(context, node, rect_w), x + rect_w / 2, y + rect_h / 2);
}


drawNeighbors = function(context, neighbors) {
    var spacing = 20;
    var numNeighbors = neighbors.length;
    console.log({neighbors : neighbors});
    if (numNeighbors > 0) {
        var rect_w = Math.min(200, (width - spacing * (numNeighbors - 1)) / numNeighbors);
        rect_h = height / 4;
        var y = (height - rect_h) * 1/4;
        var x = (width - (numNeighbors * rect_w + spacing * (numNeighbors - 1))) / 2;
        for (var i in neighbors) {
            var neighbor = neighbors[i];
            context.font = "30px Helvetica Nue, Helvetica, Arial";
            context.textAlign="center"; 
            context.strokeStyle = "#3498db";
            context.textBaseline = 'middle';
            context.strokeRect(x, y, rect_w, rect_h);
            context.fillStyle = "#2c3e50";
            context.fillText(fittingString(context, neighbor, rect_w), x + rect_w / 2, y + rect_h / 2);
            x += rect_w + spacing;
        }
    }
}

function getNeighbors(node, template) {
    var neighbors = [];
    for (i in template.edges) {
        var edge = template.edges[i];
        console.log(edge)
        if (edge.node_a === node) {
            if (neighbors.indexOf(edge.node_b) < 0) {
                neighbors.push(edge.node_b);
            }
        } else if (edge.node_b === node) {
            if (neighbors.indexOf(edge.node_a) < 0) {
                neighbors.push(edge.node_a);
            }
        }
    }
    return neighbors;
}

function fittingString(c, str, maxWidth) {
    var width = c.measureText(str).width;
    var ellipsis = '…';
    var ellipsisWidth = c.measureText(ellipsis).width;
    if (width<=maxWidth || width<=ellipsisWidth) {
        return str;
    } else {
        var len = str.length;
        while (width>=maxWidth-ellipsisWidth && len-->0) {
            str = str.substring(0, len);
            width = c.measureText(str).width;
        }
        return str+ellipsis;
    }
}
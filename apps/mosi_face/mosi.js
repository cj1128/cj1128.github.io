var ctx=$('canvas').get(0).getContext('2d');
ctx.strokeStyle='black';

var cardBack={};
var sideImage1={};
var sideImage2={};

var cWidth=600,cHeight=540;   // the game area width and height
var wWidth=680,wHeight=640;   // the whole canvas width and height
var cardWidth=100,cardHeight=90;
var cx=40,cy=100;
var mosi=[];
var firstCard,cardFinded;
var firstPick=true;
var dead1;
var dead2;       //主要是为了防止点两次以后快速点击第三次，前两张牌会不消失。
var timeOutId;   // 控制进度条时间到了以后的回调函数
var gameTime=20000;    //gametime limited,20s
var findedCount=0;
var otherImages=[];
var loadCount=0;
var imageNumbers=39;


function initialize(){
	sideImage1.image=new Image();
	sideImage1.src="./image/side1.png";
	sideImage2.image=new Image();
	sideImage2.src="./image/side2.png";
	cardBack.image=new Image();
	cardBack.src="./image/cardback.jpg"

	otherImages.push(cardBack,sideImage1,sideImage2);
	$('#loader').css("left",($(window).width()-400)/2);
	createMosi();
	loadImages();
};

function loadImages(){
	otherImages.concat(mosi).forEach(function(e){
		e.image.onload=function(){
			loadCount++;
			if(loadCount==imageNumbers){
				imageLoaded();
			}
		}
		e.image.src=e.src;
	})
}

function imageLoaded(){
	$("#loader").remove();
	$('#container').css("display","block");
	ctx.drawImage(sideImage1.image,140,0,100,100);
	ctx.drawImage(sideImage2.image,440,0,100,100);
	var i;
	for(var i=0;i<36;i++){
		mosi[i].drawCardBack();
	};
	drawGrid();
	$('#play').click(gameStart);
	$('.playAgain').click(playAgain);
}

function gameStart(){
	$('#play').attr('disabled','disabled');
	shuffle();
	for(var i=0;i<mosi.length;i++){
		mosi[i].drawCardFront();
	}
	drawGrid();
	setTimeout(function(){
		for(i=0;i<mosi.length;i++){
			mosi[i].drawCardBack();
		}
		drawGrid();
		startTimer();
	},2000);
	$('canvas').css('opacity',1)
	$('canvas').on('click',memoryMatch);
}

function startTimer(){
	$('<span></span>').appendTo('.progress-bar');
	$('.progress-bar span').width(0);
	$('.progress-bar span').width('100%');
	timeOutId=setTimeout(function(){ 
		$('.progress-bar span').remove();
		$(".gameFailure").css('display','block');
	},20000);
}


function clearTimer(){
	clearTimeout(timeOutId);
	$('.progress-bar span').remove();
}



function drawGrid(){
	var i;
	for(i=0;i<7;i++){
		ctx.moveTo(cx+100*i,cy);
		ctx.lineTo(cx+100*i,wHeight)
		ctx.stroke();
	}
	for(i=0;i<7;i++){
		ctx.moveTo(cx,cy+90*i);
		ctx.lineTo(wWidth-cx,cy+90*i);
		ctx.stroke();
	}
};

function find(x,y){
	var i=0;
	if(x<cx || x>wWidth-cx || y<cy)
		return -1;
	var hor,ver;
	hor=Math.floor((x-cx)/100);
	ver=Math.floor((y-100)/90);
	return hor*6+ver;
};

function drawCardFront(){
	var x=this.x,y=this.y;
	ctx.clearRect(x,y,cardWidth,cardHeight);
	ctx.drawImage(this.image,x,y,cardWidth,cardHeight);
};

function Card(x,y,imageIndex){
	this.x=x;
	this.y=y;
	this.src='./image/mosi_'+imageIndex+'.png';
	this.image=new Image();
	this.live=true;
	this.drawCardBack=function(){
		ctx.drawImage(cardBack.image,this.x,this.y,cardWidth,cardHeight);
	};
	this.drawCardFront=drawCardFront;
};

function createMosi(){
	var i,k;
	var tempA,tempB;
	for(i=0;i<6;i++){
		for(k=0;k<6;k++){
			var suffix;
			var index=i*6+k+1;
			if(index>18){
				index=index-18;
			};
			if(index<10){
				suffix='0'+index;
			}
			else{
				suffix=index;
			};
			temp=new Card(cx+i*100,cy+k*90,suffix);	
			mosi.push(temp);
		};	
	};
};

function memoryMatch(event){
	var x=event.offsetX;
	var y=event.offsetY;
	cardFinded=find(x,y);
	if(cardFinded>=0  &&  mosi[cardFinded].live){
		if(firstPick){
			mosi[cardFinded].drawCardFront();
			drawGrid();
			firstCard=cardFinded;
			firstPick=false;
		}
		else{
			if(firstCard!=cardFinded){
				mosi[cardFinded].drawCardFront();
				drawGrid();
				if(mosi[firstCard].src==mosi[cardFinded].src){
					console.log("match");
					findedCount++;
					if(findedCount==18){
						gameSuccess();
						return;
					}
					setTimeout(clear,350);
					clearTimer();
					startTimer();
					dead1=firstCard;
					dead2=cardFinded;
					mosi[firstCard].live=false;
					mosi[cardFinded].live=false;
					firstPick=true;
					match=true;
				}
				else{
					dead1=firstCard;
					dead2=cardFinded;
					setTimeout(reDrawBack,350);	
					firstPick=true;
				};
			};
		};
	};
};

function clear(){
	ctx.clearRect(mosi[dead1].x,mosi[dead1].y,cardWidth,cardHeight);
	ctx.clearRect(mosi[dead2].x,mosi[dead2].y,cardWidth,cardHeight);
	drawGrid();
};

function reDrawBack(){
	ctx.drawImage(cardBack.image,mosi[dead1].x,mosi[dead1].y,cardWidth,cardHeight);
	ctx.drawImage(cardBack.image,mosi[dead2].x,mosi[dead2].y,cardWidth,cardHeight);
	drawGrid();
};

function shuffle(){
	var times=3*mosi.length;
	var t;
	var temp;
	for(t=0;t<times;t++){
		var i=Math.floor(Math.random()*36);
		var k=Math.floor(Math.random()*36);
		temp=mosi[i].src;
		mosi[i].src=mosi[k].src;
		mosi[k].src=temp;

		temp=mosi[i].image;
		mosi[i].image=mosi[k].image;
		mosi[k].image=temp;
	};
};

function gameSuccess(){
	clearTimer();
	$('.gameSuccess').css('display','block');
}

function playAgain(){
	$('.gameControl').css('display','none');
	$('canvas').off().css('opacity',0.4);
	$('#play').removeAttr('disabled');
	firstPick=true;
	for(var i=0;i<36;i++){
		mosi[i].drawCardBack();
		mosi[i].live=true;
	};	
	drawGrid();
}

initialize();
class Game
{
    private _layer:egret.DisplayObjectContainer;
    public constructor(layer:egret.DisplayObjectContainer)
    {
        this._layer = layer;
        this.init();
    }
    private _restartButton:RestartButton;
    private _gesture:GestureShape;
    private _gestureShape:egret.Sprite;

    private _pauseButton:PauseButton;


    private _bgsound:egret.Sound;
    private _soundChannel:egret.SoundChannel;

    private init()
    {
        this.drawBg();

        this._gestureShape = new egret.Sprite();
        this._layer.addChild( this._gestureShape );
        this._gesture = new GestureShape();
        this._gesture.addEvent(this._gestureShape);
        Data.stage.addEventListener(MainEvent.GAMEOVER,this.gameOver,this);
        Data.stage.addEventListener(MainEvent.ATTACKED,this.beAttacked,this);
        Data.stage.addEventListener(MainEvent.GAMERESTART,this.restart,this);
        Data.stage.addEventListener(MainEvent.GAMEPAUSE, this.pauseHandler, this);
        Data.stage.addEventListener(MainEvent.GAMEGOON, this.goonHandler, this);
    }

    private _background:Background;

    private drawBg()
    {
        this._background = new Background();
        this._layer.addChild( this._background );


        this._pauseButton = new PauseButton();
        this._layer.addChild(this._pauseButton);
    }

    private _time:egret.Timer;



    private pauseHandler(){
        this._time.stop();
        this._gesture.removeEvent();
    }
    private goonHandler(){
        this._gesture.addEvent(this._gestureShape);
        this._time.start();
    }

    public start()
    {
        this._time = new egret.Timer(Data.baseTimer,0);
        this._time.addEventListener(egret.TimerEvent.TIMER,this.create,this);
        this._time.start();
        this.playBgMusic();
    }
    private create()
    {
        let times = 10;
        Data.ghostTimes++;
        if(Data.ghostTimes>0&&Data.ghostTimes%times==0){
            times+=10;
            Math.random()>0.5?Data.baseSymbolRandomNum++:Data.baseRandomSpeed++;
        }
        let ghost:GhostContainer = new GhostContainer();
        ghost.alpha=0;
        this._layer.addChild(ghost);
        egret.Tween.get( ghost ).to( {alpha:1}, 2000, egret.Ease.sineIn );
        
    }
    private playBgMusic(){
        this._bgsound = RES.getRes('bg_mp3');
        this._soundChannel=this._bgsound.play(0,-1);
        this._soundChannel.volume=0.5;
        egret.log(this._bgsound.length);
    }
    private stopBgMusic(){
        this._soundChannel.stop();
    }

    private gameOver(evt:egret.Event)
    {
        this._time.stop();
        this._gesture.removeEvent();
        this.stopBgMusic();
        this._restartButton = new RestartButton();
        this._layer.addChild(this._restartButton);
    }

    public restart(){
        Data.life=5;
        Data.score=0;
        Data.baseSpeed=1;
        Data.baseRandomSpeed=2;
        Data.baseTimer=3000;
        Data.baseSymbolNum=1;
        Data.baseSymbolRandomNum=0;
        Data.ghostTimes=0;
        this.init();
        this.start();
    }

    private beAttacked(evt:egret.Event)
    {
        this._background.updateLife();
        egret.Tween.get(this._layer).to({x:5,y:5},50).to({x:-5,y:5},50).to({x:5,y:-5},50).to({x:0,y:0},50);
    }

}
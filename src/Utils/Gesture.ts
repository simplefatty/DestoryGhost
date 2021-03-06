
enum shapeType {
    HORIZONTAL=2,
    VERTICAL=1,
    LETTER_V=0,
    REVERSED_LETTER_V=3,
    FLASH=5,
    UNKONW_TYPE=-1
}
// v 0
// | 1
// - 2
// ^ 3
// 6 4
// z 5
class GestureShape
{
    private _layer:egret.Sprite;
    private _line:egret.Shape;
    private _bg:egret.Shape;
    private _time:egret.Timer;


    private _bgColor:number = Shape.UNKONW_TYPE_COLOR;

    public addEvent(layer:egret.Sprite)
    {
        this._layer = layer;
        
        this._bg = new egret.Shape();

        this._line = new egret.Shape();
        


        this._layer.addChild(this._bg);
        this._layer.addChild(this._line);
        this.drawBackgroundColor();
        

        Data.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN,this.mouseDown,this);
        Data.stage.addEventListener(egret.TouchEvent.TOUCH_END,this.mouseUp,this);
        Data.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE,this.mouseMove,this);
    }

    
    public removeEvent()
    {
        Data.stage.removeEventListener(egret.TouchEvent.TOUCH_BEGIN,this.mouseDown,this);
        Data.stage.removeEventListener(egret.TouchEvent.TOUCH_END,this.mouseUp,this);
        Data.stage.removeEventListener(egret.TouchEvent.TOUCH_MOVE,this.mouseMove,this);
    }

    private _mouseDatas:egret.Point[];
    private _currentPoint:egret.Point;


    private drawBackgroundColor(color:number=Shape.UNKONW_TYPE_COLOR){
        this._bg.graphics.clear();
        this._bg.graphics.beginFill(color, 1);
        this._bg.graphics.drawRect(0, 0, Data.getStageW(), Data.getStageH());
        this._bg.graphics.endFill();
        this._bg.mask=this._line;
    }


    private mouseDown(evt:egret.TouchEvent)
    {
        this._line.graphics.clear();
        this._mouseDatas = [];
        let p:egret.Point = new egret.Point(evt.stageX,evt.stageY);
        this._mouseDatas.push(p);
        this._currentPoint = p;
        Data.stage.dispatchEvent(new MainEvent(MainEvent.DRAWSONG));
    }
    private mouseMove(evt:egret.TouchEvent)
    {

        let p:egret.Point = new egret.Point(evt.stageX,evt.stageY);
        this._mouseDatas.push(p);

        this._line.graphics.lineStyle(5,0) ;
        this._line.graphics.moveTo(this._currentPoint.x,this._currentPoint.y);
        this._line.graphics.lineTo(p.x,p.y);
        this._line.graphics.endFill();
        this._currentPoint = p;
        //判断图形重绘颜色
        this.shouldDrawBgColor(this.motion());
    }
    private mouseUp(evt:egret.TouchEvent)
    {
        
        let p:egret.Point = new egret.Point(evt.stageX,evt.stageY);

        
        this._mouseDatas.push(p);
        this._line.graphics.clear();

        this.disEvent(this.motion());
    }

    private shouldDrawBgColor(type:number){
        let color:number;
        switch(type){
            case shapeType.HORIZONTAL:
                color=Shape.HORIZONTAL_COLOR;
                break;
            case shapeType.VERTICAL:
                color=Shape.VERTICAL_COLOR;
                break;
            case shapeType.LETTER_V:
                color=Shape.LETTER_V_COLOR;
                break;
            case shapeType.REVERSED_LETTER_V:
                color=Shape.REVERSED_LETTER_V_COLOR;
                break;
            case shapeType.FLASH:
                color=Shape.FLASH_COLOR;
                break;
            default:
                color = Shape.UNKONW_TYPE_COLOR;
        }
        if(color!=this._bgColor){
            this.drawBackgroundColor(color);
            this._bgColor = color;
        }
    }



    private motion()
    {
        let _arr:egret.Point[] = [];
        let currentIndex:number = 0;
        let len:number = this._mouseDatas.length;
        _arr.push(this._mouseDatas[currentIndex]);
        for(let i:number=0; i<len; i++)
        {
            if( egret.Point.distance(this._mouseDatas[currentIndex], this._mouseDatas[i])>30 )
            {
                currentIndex = i;
                _arr.push(this._mouseDatas[currentIndex]);
            }
        }

        this._mouseDatas = _arr;

        return this.parseDirection();
    }

    private _dirsArr:number[];
    private parseDirection()
    {

        this._dirsArr = [];
        let len:number = this._mouseDatas.length;
        for(let i:number=0; i<len; i++)
        {
            if( this._mouseDatas[i+1])
            {
                let p1:egret.Point = this._mouseDatas[i];
                let p2:egret.Point = this._mouseDatas[i+1];
                let a:number = p1.y - p2.y;
                let b:number = egret.Point.distance(p1,p2);
                let rad:number = Math.asin( a/b );
                let ang:number = rad * 57.2957800; // rad * 180/Math.PI 直接求常量，优化
                let quad:number = this.quadrant(p1,p2);
                let dir:number = this.getDirByAngQuad(ang, quad);
                this._dirsArr.push(dir);
            }
        }
        let dirstr:string = this.repDiff( this._dirsArr );
        let rel:number = this.sweep( dirstr );
        return rel;
    }

    private disEvent(type:number)
    {
        Data.type = type;
        if(type != -1)
        {
            Data.flashDetoryStatus = false;
            Data.stage.dispatchEvent(new MainEvent(MainEvent.DISTORYACTION,null,true));
        }else{
            Data.stage.dispatchEvent(new MainEvent(MainEvent.CATSTAND));
        }
    }

    private _symbol:string[] = ["28","46","82","64","141","585","3","7","5","1","4321876","2345678"];
    private _symbolG:number[] = [0,0,3,3,5,5,1,1,2,2,5,-1];

    

    private sweep( str:string ):number
    {
        let maxType:number = -1;
        let max:number = -1;
        let len:number = this._symbol.length;
        for(let i:number=0; i<len; i++)
        {
            let val:number = this.Levenshtein_Distance_Percent(this._symbol[i], str);
            // egret.log(val,max,'time:'+i);
            if(val>max)
            {
                // egret.log('time:'+i)
                max = val;
                maxType = this._symbolG[i];
            }
        }

        if(max<0.25)
        {
            maxType = -1;
        }
        // egret.log('结果:'+maxType)
        return maxType;
    }

    /*
    对比去重
     */
    private repDiff(data:number[]):string
    {
        let str:string = "";
        let len:number = data.length;
        let currentType:number = 0;
        for(let i:number=0; i<len; i++)
        {
            if( currentType != data[i])
            {
                currentType = data[i];
                str += data[i];
            }
        }
        return str;
    }
    /*
    根据所在象限与角度计算出方向编号。
    方向编号，以第一象限0度为基础，按照顺时针方向，将圆等分为8份。
     */
    private getDirByAngQuad(ang:number,quad:number):number
    {
        switch(quad)
        {
            case 1:
                if( ang<=22.5 && ang>= 0 )
                {
                    return 1;
                }
                else if( ang<= 67.5 && ang> 22.5 )
                {
                    return 8;
                }
                else
                {
                    return 7;
                }
            case 2:
                if( ang<=22.5 && ang>=0 )
                {
                    return 5;
                }
                else if( ang<= 67.5 && ang> 22.5 )
                {
                    return 6;
                }
                else
                {
                    return 7;
                }
            case 3:
                if( ang<= -67.5 && ang>= -90 )
                {
                    return 3;
                }
                else if( ang<=-22.5 && ang> -67.5 )
                {
                    return 4;
                }
                else{
                    return 5;
                }
            case 4:
                if( ang<=-67.5 && ang>= -90 )
                {
                    return 3;
                }
                else if( ang<=-22.5 && ang>-67.5)
                {
                    return 2;
                }
                else{
                    return 1;
                }
        }
    }

    /*
    计算两点关系所形成的象限
    以P1 作为坐标原点，P2为设定点，判断P2相对于P1时所在象限
     */
    private quadrant(p1:egret.Point,p2:egret.Point):number
    {
        if(p2.x>=p1.x)
        {
            if( p2.y <= p1.y )
            {
                return 1;
            }
            else
            {
                return 4;
            }
        }
        else
        {
            if( p2.y <= p1.y )
            {
                return 2;
            }
            else
            {
                return 3;
            }
        }
    }

    private Levenshtein_Distance(s,t)
    {
        let n=s.length;// length of s
        let m=t.length;// length of t
        let d=[];// matrix
        let i;// iterates through s
        let j;// iterates through t
        let s_i;// ith character of s
        let t_j;// jth character of t
        let cost;// cost

        // Step 1
        if (n == 0) return m;
        if (m == 0) return n;

        // Step 2
        for (i = 0; i <= n; i++) {
            d[i]=[];
            d[i][0] = i;
        }

        for (j = 0; j <= m; j++) {
            d[0][j] = j;
        }

        // Step 3

        for (i = 1; i <= n; i++) {
            s_i = s.charAt (i - 1);
            // Step 4
            for (j = 1; j <= m; j++) {
                t_j = t.charAt (j - 1);
                // Step 5
                if (s_i == t_j) {
                    cost = 0;
                }else{
                    cost = 1;
                }

                // Step 6
                d[i][j] = this.Minimum (d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1] + cost);
            }
        }

        // Step 7
        return d[n][m];
    }

    private Levenshtein_Distance_Percent(s,t):number{

        let l=s.length>t.length?s.length:t.length;
        let d=this.Levenshtein_Distance(s,t);
        return (1-d/l);//.toFixed(4);

    }

    private Minimum(a,b,c){
        return a<b?(a<c?a:c):(b<c?b:c);
    }
}
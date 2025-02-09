/**
 * 贪吃蛇游戏主类
 * @class SnakeGame
 */
class SnakeGame {
    /**
     * 初始化游戏
     * @constructor
     */
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 40; // 增大网格大小
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.isStarted = false;
        this.gameLoopId = null;
        
        // 速度相关设置
        this.baseSpeed = 150;
        this.speedMultiplier = 0.5; // 初始速度设为0.5
        this.speed = this.baseSpeed / this.speedMultiplier;
        this.minSpeedMultiplier = 0.5;
        this.maxSpeedMultiplier = 3;

        // 初始化速度显示
        document.getElementById('speed').textContent = this.speedMultiplier.toFixed(2);

        // 关卡系统
        this.currentLevel = 1;
        this.obstacles = [];
        this.food = this.generateFood();

        // 蛇的皮肤
        this.snakeSkin = 'classic';
        this.gradientColors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8f00ff'];

        // 最高分记录
        this.highScores = this.loadHighScores();

        this.initializeControls();
        this.setupEventListeners();
        this.loadLevel(this.currentLevel);
        
        // 初始化时绘制一次游戏画面
        this.draw();
    }

    /**
     * 初始化游戏控件
     */
    initializeControls() {
        // 关卡选择
        document.getElementById('levelSelect').addEventListener('change', (e) => {
            if (!this.isStarted) {
                this.loadLevel(parseInt(e.target.value));
            }
        });

        // 皮肤选择
        document.getElementById('snakeSkin').addEventListener('change', (e) => {
            this.snakeSkin = e.target.value;
            if (this.isStarted) {
                this.draw();
            }
        });

        // 游戏控制按钮
        document.getElementById('startGame').addEventListener('click', () => {
            document.getElementById('startScreen').style.display = 'none';
            this.resetGame();
            this.isStarted = true;
        });
        
        document.getElementById('pauseGame').addEventListener('click', () => {
            if (this.isStarted) {
                this.togglePause();
            }
        });
        
        document.getElementById('saveGame').addEventListener('click', () => {
            if (this.isStarted) {
                this.saveGame();
            }
        });
        
        document.getElementById('loadGame').addEventListener('click', () => {
            this.loadGame();
        });
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            } else if (e.key === ' ') {
                if (this.isPaused) this.togglePause();
            }
        });
    }

    /**
     * 加载关卡
     * @param {number} level - 关卡编号
     */
    loadLevel(level) {
        this.currentLevel = level;
        this.obstacles = [];
        document.getElementById('level').textContent = level;

        switch (level) {
            case 1: // 简单墙壁
                this.addSimpleWalls();
                break;
            case 2: // 迷宫模式
                this.generateMaze();
                break;
            case 3: // 移动障碍
                this.addMovingObstacles();
                break;
        }
    }

    /**
     * 添加简单墙壁
     */
    addSimpleWalls() {
        const maxX = this.canvas.width / this.gridSize;
        const maxY = this.canvas.height / this.gridSize;
        
        // 添加四周墙壁
        for (let i = 0; i < maxX; i++) {
            this.obstacles.push({x: i, y: 0});
            this.obstacles.push({x: i, y: maxY - 1});
        }
        for (let i = 0; i < maxY; i++) {
            this.obstacles.push({x: 0, y: i});
            this.obstacles.push({x: maxX - 1, y: i});
        }
    }

    /**
     * 生成迷宫障碍
     */
    generateMaze() {
        const maxX = this.canvas.width / this.gridSize;
        const maxY = this.canvas.height / this.gridSize;
        
        // 简单的迷宫生成算法
        for (let i = 5; i < maxX - 5; i += 4) {
            for (let j = 5; j < maxY - 5; j += 4) {
                if (Math.random() > 0.5) {
                    this.obstacles.push({x: i, y: j});
                    this.obstacles.push({x: i + 1, y: j});
                }
            }
        }
    }

    /**
     * 添加移动障碍
     */
    addMovingObstacles() {
        for (let i = 0; i < 3; i++) {
            this.obstacles.push({
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                dx: Math.random() > 0.5 ? 1 : -1,
                dy: Math.random() > 0.5 ? 1 : -1
            });
        }
    }

    /**
     * 更新移动障碍物位置
     */
    updateMovingObstacles() {
        if (this.currentLevel === 3) {
            this.obstacles.forEach(obstacle => {
                if (obstacle.dx) {
                    obstacle.x += obstacle.dx;
                    if (obstacle.x <= 0 || obstacle.x >= this.canvas.width / this.gridSize - 1) {
                        obstacle.dx *= -1;
                    }
                }
                if (obstacle.dy) {
                    obstacle.y += obstacle.dy;
                    if (obstacle.y <= 0 || obstacle.y >= this.canvas.height / this.gridSize - 1) {
                        obstacle.dy *= -1;
                    }
                }
            });
        }
    }

    /**
     * 切换游戏暂停状态
     */
    togglePause() {
        if (!this.isStarted || this.gameOver) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseGame').textContent = this.isPaused ? '继续游戏' : '暂停游戏';
        
        if (!this.isPaused) {
            this.gameLoop();
        }
    }

    /**
     * 保存游戏状态
     */
    saveGame() {
        const gameState = {
            snake: this.snake,
            score: this.score,
            level: this.currentLevel,
            speed: this.speedMultiplier
        };
        localStorage.setItem('snakeGameSave', JSON.stringify(gameState));
        alert('游戏已保存！');
    }

    /**
     * 加载游戏存档
     */
    loadGame() {
        const savedState = localStorage.getItem('snakeGameSave');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.snake = state.snake;
            this.score = state.score;
            this.currentLevel = state.level;
            this.speedMultiplier = state.speed;
            this.loadLevel(this.currentLevel);
            document.getElementById('score').textContent = this.score;
            document.getElementById('speed').textContent = this.speedMultiplier.toFixed(2);
            alert('游戏已加载！');
        } else {
            alert('没有找到存档！');
        }
    }

    /**
     * 加载最高分记录
     * @returns {Array} 最高分数组
     */
    loadHighScores() {
        const scores = localStorage.getItem('snakeHighScores');
        return scores ? JSON.parse(scores) : [];
    }

    /**
     * 保存最高分
     */
    saveHighScore() {
        this.highScores.push({
            score: this.score,
            level: this.currentLevel,
            date: new Date().toLocaleDateString()
        });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 5); // 只保留前5个最高分
        localStorage.setItem('snakeHighScores', JSON.stringify(this.highScores));
        this.updateHighScoreDisplay();
    }

    /**
     * 更新最高分显示
     */
    updateHighScoreDisplay() {
        const list = document.getElementById('highScoresList');
        list.innerHTML = '';
        this.highScores.forEach(score => {
            const li = document.createElement('li');
            li.textContent = `${score.score}分 - 关卡${score.level} (${score.date})`;
            list.appendChild(li);
        });
    }

    /**
     * 重置游戏
     */
    resetGame() {
        // 清除之前的游戏循环
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.isStarted = true;
        this.food = this.generateFood();
        document.getElementById('score').textContent = '0';
        
        // 开始新的游戏循环
        this.gameLoop();
    }

    /**
     * 生成食物的随机位置
     * @returns {{x: number, y: number}} 食物的坐标
     */
    generateFood() {
        const maxX = this.canvas.width / this.gridSize - 1;
        const maxY = this.canvas.height / this.gridSize - 1;
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };
        } while (
            this.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
            this.obstacles.some(obs => obs.x === food.x && obs.y === food.y)
        );
        return food;
    }

    /**
     * 处理键盘按键事件
     * @param {KeyboardEvent} event - 键盘事件对象
     */
    handleKeyPress(event) {
        if (this.isPaused) return;

        // 方向键控制
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        const newDirection = keyMap[event.key];
        if (newDirection) {
            const opposites = {
                'up': 'down',
                'down': 'up',
                'left': 'right',
                'right': 'left'
            };

            if (opposites[newDirection] !== this.direction) {
                this.direction = newDirection;
            }
            return;
        }

        // 速度调节
        if (event.key === '+' || event.key === '=') {
            this.adjustSpeed(0.25);
        } else if (event.key === '-' || event.key === '_') {
            this.adjustSpeed(-0.25);
        }
    }

    /**
     * 调整游戏速度
     * @param {number} delta - 速度变化值
     */
    adjustSpeed(delta) {
        const newMultiplier = Math.max(
            this.minSpeedMultiplier,
            Math.min(this.maxSpeedMultiplier, this.speedMultiplier + delta)
        );
        
        if (newMultiplier !== this.speedMultiplier) {
            this.speedMultiplier = newMultiplier;
            this.speed = this.baseSpeed / this.speedMultiplier;
            document.getElementById('speed').textContent = this.speedMultiplier.toFixed(2);
        }
    }

    /**
     * 更新游戏状态
     */
    update() {
        if (this.gameOver || this.isPaused) return;

        // 更新移动障碍
        this.updateMovingObstacles();

        // 获取蛇头位置
        const head = {...this.snake[0]};

        // 根据方向移动蛇头
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver = true;
            this.saveHighScore();
            return;
        }

        // 添加新的蛇头
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10 * this.currentLevel; // 根据关卡增加分数
            document.getElementById('score').textContent = this.score;
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    /**
     * 检查碰撞
     * @param {{x: number, y: number}} head - 蛇头位置
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision(head) {
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }

        // 检查障碍物碰撞
        if (this.obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
            return true;
        }

        // 检查自身碰撞
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    /**
     * 绘制游戏画面
     */
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格背景
        this.drawGrid();

        // 绘制障碍物
        this.drawObstacles();

        // 绘制蛇
        this.drawSnake();

        // 绘制食物
        this.drawFood();

        // 绘制游戏状态
        if (this.gameOver) {
            this.drawGameOver();
        } else if (this.isPaused) {
            this.drawPaused();
        }
    }

    /**
     * 绘制网格背景
     */
    drawGrid() {
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= this.canvas.height; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }

    /**
     * 绘制障碍物
     */
    drawObstacles() {
        this.ctx.fillStyle = '#e74c3c';
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(
                obstacle.x * this.gridSize,
                obstacle.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });
    }

    /**
     * 绘制蛇
     */
    drawSnake() {
        this.snake.forEach((segment, index) => {
            switch (this.snakeSkin) {
                case 'classic':
                    this.ctx.fillStyle = index === 0 ? '#2ecc71' : '#27ae60';
                    break;
                case 'gradient':
                    const colorIndex = index % this.gradientColors.length;
                    this.ctx.fillStyle = this.gradientColors[colorIndex];
                    break;
                case 'neon':
                    this.ctx.fillStyle = `hsl(${(index * 10) % 360}, 100%, 50%)`;
                    this.ctx.shadowColor = this.ctx.fillStyle;
                    this.ctx.shadowBlur = 10;
                    break;
            }

            // 绘制圆形蛇身
            const x = segment.x * this.gridSize + this.gridSize / 2;
            const y = segment.y * this.gridSize + this.gridSize / 2;
            const radius = this.gridSize / 2 - 1;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 重置阴影效果
            this.ctx.shadowBlur = 0;
        });
    }

    /**
     * 绘制食物
     */
    drawFood() {
        const x = this.food.x * this.gridSize + this.gridSize / 2;
        const y = this.food.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 3;

        // 创建渐变效果
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, '#f1c40f');
        gradient.addColorStop(1, '#e67e22');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 添加光晕效果
        this.ctx.shadowColor = '#f1c40f';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 绘制游戏结束画面
     */
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(
            `最终得分: ${this.score}`,
            this.canvas.width / 2,
            this.canvas.height / 2 + 40
        );
        
        this.ctx.fillText(
            '按空格键重新开始',
            this.canvas.width / 2,
            this.canvas.height / 2 + 80
        );
    }

    /**
     * 绘制暂停画面
     */
    drawPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(
            '按空格键继续',
            this.canvas.width / 2,
            this.canvas.height / 2 + 40
        );
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.isStarted || this.gameOver) return;
        
        this.update();
        this.draw();
        
        if (!this.gameOver && !this.isPaused) {
            this.gameLoopId = setTimeout(() => {
                requestAnimationFrame(this.gameLoop.bind(this));
            }, this.speed);
        }
    }
}

// 当页面加载完成后启动游戏
window.onload = () => new SnakeGame(); 
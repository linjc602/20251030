let quizTable; // 儲存 CSV 讀取的資料
let questions = []; // 儲存格式化後的題目物件
let currentQuestionIndex = 0; // 當前題目索引
let score = 0; // 學生分數
let quizState = 'QUIZ'; // 狀態: 'QUIZ' (測驗中), 'RESULT' (結果頁)

let selectedOption = null; // 當前選取的選項 (A, B, C)
let optionButtons = []; // 儲存選項按鈕的物件陣列

// --- 顏色和設計參數 ---
const COLOR_PRIMARY = '#1E90FF'; // 主色：道奇藍
const COLOR_CORRECT = '#3CB371'; // 正確：中海綠
const COLOR_INCORRECT = '#FF6347'; // 錯誤：番茄紅
const COLOR_HOVER = '#ADD8E6'; // 懸停：淺藍
const COLOR_BACKGROUND = 240;

// --- 1. 讀取 CSV 檔案 ---
function preload() {
    // p5.js 的 loadTable 函數：讀取 CSV，指定 'csv' 格式，並設 'header' 表示有標題行
    quizTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
    createCanvas(800, 600);
    noStroke();
    
    // 格式化題目數據
    let rows = quizTable.getRows();
    for (let i = 0; i < rows.length; i++) {
        questions.push({
            question: rows[i].getString('question'),
            options: {
                A: rows[i].getString('optionA'),
                B: rows[i].getString('optionB'),
                C: rows[i].getString('optionC')
            },
            answer: rows[i].getString('answer')
        });
    }

    // 初始化選項按鈕
    for (let i = 0; i < 3; i++) {
        optionButtons.push({
            x: 100,
            y: 300 + i * 80,
            w: 600,
            h: 60,
            name: ['A', 'B', 'C'][i]
        });
    }
}

function draw() {
    background(COLOR_BACKGROUND);

    if (quizState === 'QUIZ') {
        displayQuiz();
    } else if (quizState === 'RESULT') {
        displayResult();
    }
    
    // --- 3. 游標特效 ---
    drawCustomCursor();
}

// 繪製測驗介面
function displayQuiz() {
    if (currentQuestionIndex >= questions.length) {
        quizState = 'RESULT';
        return;
    }

    let q = questions[currentQuestionIndex];

    // 顯示問題
    fill(50);
    textSize(24);
    textAlign(LEFT, TOP);
    text(`問題 ${currentQuestionIndex + 1} / ${questions.length}:`, 100, 100);
    textSize(32);
    text(q.question, 100, 140, 600, 100);

    // 顯示選項
    textSize(20);
    for (let btn of optionButtons) {
        let isHover = mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
        
        // --- 4. 選取選項時的特效 (視覺回饋) ---
        let currentColor = COLOR_PRIMARY;
        if (selectedOption === btn.name) {
            // 被選中時的特效 (閃爍/顏色加深)
            currentColor = lerpColor(color(COLOR_PRIMARY), color(0, 150, 255), (sin(frameCount * 0.1) + 1) / 2);
        } else if (isHover) {
            currentColor = COLOR_HOVER;
        }

        fill(currentColor);
        rect(btn.x, btn.y, btn.w, btn.h, 10); // 圓角矩形

        fill(255);
        textAlign(LEFT, CENTER);
        text(`${btn.name}. ${q.options[btn.name]}`, btn.x + 20, btn.y + btn.h / 2);
    }
    
    // 顯示當前分數
    fill(100);
    textSize(18);
    textAlign(RIGHT, TOP);
    text(`目前分數: ${score}`, width - 50, 50);
}

// 處理滑鼠點擊
function mousePressed() {
    if (quizState === 'QUIZ') {
        for (let btn of optionButtons) {
            let isInside = mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
            
            if (isInside) {
                if (selectedOption !== btn.name) {
                    // 選取選項
                    selectedOption = btn.name;
                    // 可以加入音效或短暫的視覺震動效果
                } else {
                    // 確定答案
                    checkAnswer(btn.name);
                }
                break;
            }
        }
    } else if (quizState === 'RESULT') {
        // 在結果頁面點擊可以重來
        if (mouseY > height - 100) {
            resetQuiz();
        }
    }
}

// 檢查答案並進入下一題
function checkAnswer(chosenAnswer) {
    let q = questions[currentQuestionIndex];
    let isCorrect = chosenAnswer === q.answer;

    if (isCorrect) {
        score++;
    }
    
    // 短暫顯示正確/錯誤回饋
    let feedbackColor = isCorrect ? COLOR_CORRECT : COLOR_INCORRECT;
    fill(feedbackColor, 200);
    rect(0, 0, width, height); // 整個畫面閃爍
    
    // 暫停一下再進入下一題
    setTimeout(() => {
        currentQuestionIndex++;
        selectedOption = null; // 重置選項
    }, 500); // 0.5 秒後換下一題
}

// --- 2. 條件式的動畫畫面 (結果頁) ---
function displayResult() {
    let percentage = (score / questions.length) * 100;
    
    let resultMessage = "";
    let animationFunction; // 根據分數選擇動畫

    if (percentage === 100) {
        resultMessage = "🎉 滿分！太棒了！ 🎉";
        animationFunction = animateCheering; // 稱讚動畫
    } else if (percentage >= 60) {
        resultMessage = `👍 成績不錯！得分: ${score} / ${questions.length}`;
        animationFunction = animateGoodJob; // 中等鼓勵動畫
    } else {
        resultMessage = `💪 需要再努力喔！得分: ${score} / ${questions.length}`;
        animationFunction = animateEncouragement; // 鼓勵動畫
    }

    // 繪製結果訊息
    fill(50);
    textSize(48);
    textAlign(CENTER, CENTER);
    text(resultMessage, width / 2, height / 2 - 100);
    
    // 執行條件式動畫
    animationFunction();
    
    // 重新開始按鈕
    fill(COLOR_PRIMARY);
    rect(width / 2 - 100, height - 80, 200, 40, 10);
    fill(255);
    textSize(20);
    text("重新測驗", width / 2, height - 60);
}

// 滿分稱讚動畫: 散發星星
function animateCheering() {
    for (let i = 0; i < 5; i++) {
        let x = random(width);
        let y = random(height / 2);
        let size = random(10, 30);
        let alpha = map(sin(frameCount * 0.1 + i), -1, 1, 100, 255); // 閃爍效果
        
        fill(255, 215, 0, alpha); // 金色
        star(x, y, size, size / 2, 5); // 繪製五角星
    }
}

// 中等鼓勵動畫: 向上漂浮的圓圈
function animateGoodJob() {
    for (let i = 0; i < 10; i++) {
        let x = width / 2 + sin(frameCount * 0.05 + i) * 100;
        let y = height * (1 - (frameCount * 0.01 + i * 0.1) % 1); // 緩慢上升
        let size = 20;
        
        fill(COLOR_CORRECT, 150);
        ellipse(x, y, size, size);
    }
}

// 鼓勵動畫: 脈動的心跳
function animateEncouragement() {
    let pulseSize = map(sin(frameCount * 0.1), -1, 1, 0, 50);
    fill(COLOR_INCORRECT, 180); // 紅色
    ellipse(width / 2, height / 2 + 100, 150 + pulseSize, 150 + pulseSize);
    
    fill(255);
    textSize(24);
    text("繼續加油！", width / 2, height / 2 + 100);
}

// 繪製五角星 (Helper Function)
function star(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius1;
        sy = y + sin(a + halfAngle) * radius1;
        vertex(sx, sy);
    }
    endShape(CLOSE);
}

// --- 3. 游標特效 (自定義游標) ---
function drawCustomCursor() {
    noCursor(); // 隱藏系統游標

    let d = 20; // 游標直徑
    let trailLength = 5; // 軌跡長度
    let currentAlpha = 255;
    
    // 判斷是否在可點擊區域 (選項按鈕)
    let isOverButton = false;
    if (quizState === 'QUIZ') {
        for (let btn of optionButtons) {
            if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
                isOverButton = true;
                break;
            }
        }
    }
    
    if (isOverButton) {
        // 懸停在按鈕上：游標變成手型或脈衝
        d = 30; // 變大
        fill(255, 165, 0, 200); // 橘色
        ellipse(mouseX, mouseY, d, d);
        fill(255, 255, 255, 150); // 中間白點
        ellipse(mouseX, mouseY, d/2, d/2);
    } else {
        // 預設游標：圓形軌跡
        for (let i = 0; i < trailLength; i++) {
            let x = lerp(mouseX, pmouseX, i / trailLength);
            let y = lerp(mouseY, pmouseY, i / trailLength);
            let size = lerp(d, 5, i / trailLength);
            let alpha = lerp(currentAlpha, 50, i / trailLength);
            
            fill(COLOR_PRIMARY, alpha);
            ellipse(x, y, size, size);
        }
    }
}

// 重置測驗
function resetQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    quizState = 'QUIZ';
}
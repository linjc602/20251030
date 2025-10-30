let quizTable; // 儲存 CSV 讀取的資料
let questions = []; // 儲存格式化後的題目物件
let currentQuestionIndex = 0; // 當前題目索引
let score = 0; // 學生分數
let quizState = 'QUIZ'; // 狀態: 'QUIZ' (測驗中), 'RESULT' (結果頁)

let selectedOption = null; // 當前選取的選項 (A, B, C)
let optionButtons = []; // 儲存選項按鈕的物件陣列

// --- 響應式基礎設定 ---
const BASE_WIDTH = 800; // 原始設計的寬度基準
const BASE_HEIGHT = 600; // 原始設計的高度基準

// --- 顏色和設計參數 (原始十六進制字串) ---
const COLOR_PRIMARY_HEX = '#1E90FF'; // 主色：道奇藍
const COLOR_CORRECT_HEX = '#3CB371'; // 正確：中海綠
const COLOR_INCORRECT_HEX = '#FF6347'; // 錯誤：番茄紅
const COLOR_HOVER_HEX = '#ADD8E6'; // 懸停：淺藍
const COLOR_BACKGROUND = 240; // 灰度背景

// p5.Color 物件
let cPrimary, cCorrect, cIncorrect, cHover, cSelectEffect; 


// --- 1. 讀取 CSV 檔案 ---
function preload() {
    quizTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
    // 初始設置畫布大小，讓它能適應當前窗口大小
    createCanvas(windowWidth, windowHeight);
    noStroke();
    
    // 將所有顏色字串轉換為 p5.Color 物件
    cPrimary = color(COLOR_PRIMARY_HEX);
    cCorrect = color(COLOR_CORRECT_HEX);
    cIncorrect = color(COLOR_INCORRECT_HEX);
    cHover = color(COLOR_HOVER_HEX);
    cSelectEffect = color(0, 150, 255); 

    // 格式化題目數據 (只需要執行一次)
    if (questions.length === 0) {
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
    }
    
    // 根據當前畫布大小重新計算按鈕位置和大小
    updateLayout();
}

/**
 * 處理窗口大小改變時的邏輯：
 * 重新調整畫布大小並更新所有依賴於 width/height 的佈局。
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    updateLayout();
}

/**
 * 核心響應式佈局計算函數。
 * 根據當前 width 和 height 重新計算元素的位置和大小。
 */
function updateLayout() {
    // 找出寬度或高度的比例尺中較小的一個，以確保元素不會跑出畫面
    let scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
    
    // 清空並重新初始化選項按鈕，使用比例尺計算
    optionButtons = [];
    
    // 使用比例尺計算按鈕的 X 座標、寬度、高度和間距
    const btnW = width * 0.75; // 佔畫布寬度的 75%
    const btnH = 60 * scaleFactor; // 高度隨比例調整
    const startX = (width - btnW) / 2; // 置中
    const startY = height / 2 - btnH * 1.5; // 從畫布中間稍微偏上開始
    const spacing = 20 * scaleFactor; // 間距

    for (let i = 0; i < 3; i++) {
        optionButtons.push({
            x: startX,
            y: startY + i * (btnH + spacing),
            w: btnW,
            h: btnH,
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
    
    drawCustomCursor();
}

// 繪製測驗介面
function displayQuiz() {
    if (currentQuestionIndex >= questions.length) {
        quizState = 'RESULT';
        return;
    }
    
    let scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
    let q = questions[currentQuestionIndex];

    // 顯示問題 (文字大小隨比例尺調整)
    fill(50);
    textSize(24 * scaleFactor);
    textAlign(LEFT, TOP);
    text(`問題 ${currentQuestionIndex + 1} / ${questions.length}:`, width * 0.1, height * 0.1);
    
    textSize(32 * scaleFactor);
    // 問題的 X 軸位置、Y 軸位置、寬度、高度都使用比例計算
    text(q.question, width * 0.1, height * 0.15, width * 0.8, height * 0.2);

    // 顯示選項
    textSize(20 * scaleFactor);
    for (let btn of optionButtons) {
        let isHover = mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
        
        let currentColor = cPrimary;
        if (selectedOption === btn.name) {
            currentColor = lerpColor(cPrimary, cSelectEffect, (sin(frameCount * 0.1) + 1) / 2);
        } else if (isHover) {
            currentColor = cHover;
        }

        fill(currentColor); 
        rect(btn.x, btn.y, btn.w, btn.h, 10 * scaleFactor); // 圓角也隨比例調整

        fill(255);
        textAlign(LEFT, CENTER);
        text(`${btn.name}. ${q.options[btn.name]}`, btn.x + 20 * scaleFactor, btn.y + btn.h / 2);
    }
    
    // 顯示當前分數
    fill(100);
    textSize(18 * scaleFactor);
    textAlign(RIGHT, TOP);
    text(`目前分數: ${score}`, width - width * 0.05, height * 0.05);
}

// 處理滑鼠點擊 (此處邏輯不變，因為按鈕物件已更新)
function mousePressed() {
    if (quizState === 'QUIZ') {
        for (let btn of optionButtons) {
            let isInside = mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
            
            if (isInside) {
                if (selectedOption !== btn.name) {
                    selectedOption = btn.name;
                } else {
                    checkAnswer(btn.name);
                }
                break;
            }
        }
    } else if (quizState === 'RESULT') {
        // 點擊重新開始按鈕區域
        let scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
        let btnY = height - 80 * scaleFactor;
        let btnH = 40 * scaleFactor;
        let btnW = 200 * scaleFactor;
        let btnX = width / 2 - btnW / 2;
        
        if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
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
    
    let feedbackColor = isCorrect ? cCorrect : cIncorrect; 
    let flashColor = color(feedbackColor.levels[0], feedbackColor.levels[1], feedbackColor.levels[2], 200);

    fill(flashColor); 
    rect(0, 0, width, height); 
    
    setTimeout(() => {
        currentQuestionIndex++;
        selectedOption = null; 
    }, 500); 
}

// --- 2. 條件式的動畫畫面 (結果頁) ---
function displayResult() {
    let scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
    let percentage = (score / questions.length) * 100;
    
    let resultMessage = "";
    let animationFunction = () => {};

    if (questions.length === 0) {
         resultMessage = "題庫載入錯誤！";
    } else if (percentage === 100) {
        resultMessage = "🎉 滿分！太棒了！ 🎉";
        animationFunction = animateCheering;
    } else if (percentage >= 60) {
        resultMessage = `👍 成績不錯！得分: ${score} / ${questions.length}`;
        animationFunction = animateGoodJob;
    } else {
        resultMessage = `💪 需要再努力喔！得分: ${score} / ${questions.length}`;
        animationFunction = animateEncouragement;
    }

    // 繪製結果訊息
    fill(50);
    textSize(48 * scaleFactor);
    textAlign(CENTER, CENTER);
    text(resultMessage, width / 2, height / 2 - 100 * scaleFactor);
    
    // 執行條件式動畫
    animationFunction(scaleFactor); // 將比例尺傳給動畫函數
    
    // 重新開始按鈕
    const btnW = 200 * scaleFactor;
    const btnH = 40 * scaleFactor;
    const btnY = height - 80 * scaleFactor;
    
    fill(cPrimary); 
    rect(width / 2 - btnW / 2, btnY, btnW, btnH, 10 * scaleFactor);
    fill(255);
    textSize(20 * scaleFactor);
    text("重新測驗", width / 2, btnY + btnH / 2);
}

// 滿分稱讚動畫: 散發星星
function animateCheering(scaleFactor = 1) {
    for (let i = 0; i < 5; i++) {
        let x = random(width);
        let y = random(height / 2);
        let size = random(10, 30) * scaleFactor;
        let alpha = map(sin(frameCount * 0.1 + i), -1, 1, 100, 255); 
        
        fill(255, 215, 0, alpha); 
        star(x, y, size, size / 2, 5); // 繪製五角星
    }
}

// 中等鼓勵動畫: 向上漂浮的圓圈
function animateGoodJob(scaleFactor = 1) {
    for (let i = 0; i < 10; i++) {
        let x = width / 2 + sin(frameCount * 0.05 + i) * 100 * scaleFactor;
        let y = height * (1 - (frameCount * 0.01 + i * 0.1) % 1); 
        let size = 20 * scaleFactor;
        
        let bubbleColor = color(cCorrect.levels[0], cCorrect.levels[1], cCorrect.levels[2], 150);
        fill(bubbleColor);
        ellipse(x, y, size, size);
    }
}

// 鼓勵動畫: 脈動的心跳
function animateEncouragement(scaleFactor = 1) {
    let pulseSize = map(sin(frameCount * 0.1), -1, 1, 0, 50 * scaleFactor);
    let heartSize = 150 * scaleFactor;
    let heartY = height / 2 + 100 * scaleFactor;
    
    let heartColor = color(cIncorrect.levels[0], cIncorrect.levels[1], cIncorrect.levels[2], 180);
    fill(heartColor); 
    
    ellipse(width / 2, heartY, heartSize + pulseSize, heartSize + pulseSize);
    
    fill(255);
    textSize(24 * scaleFactor);
    text("繼續加油！", width / 2, heartY);
}

// 繪製五角星 (Helper Function)
function star(x, y, radius1, radius2, npoints) {
    // 保持不變
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
    let scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);

    let d = 20 * scaleFactor; // 游標直徑
    let trailLength = 5; 
    let currentAlpha = 255;
    
    let isOverButton = false;
    if (quizState === 'QUIZ') {
        for (let btn of optionButtons) {
            if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
                isOverButton = true;
                break;
            }
        }
    } else if (quizState === 'RESULT') {
         // 檢查是否在「重新測驗」按鈕上
        const btnW = 200 * scaleFactor;
        const btnH = 40 * scaleFactor;
        const btnY = height - 80 * scaleFactor;
        const btnX = width / 2 - btnW / 2;
        
        if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
             isOverButton = true;
        }
    }
    
    if (isOverButton) {
        d = 30 * scaleFactor;
        fill(255, 165, 0, 200); 
        ellipse(mouseX, mouseY, d, d);
        fill(255, 255, 255, 150); 
        ellipse(mouseX, mouseY, d/2, d/2);
    } else {
        // 預設游標：圓形軌跡
        for (let i = 0; i < trailLength; i++) {
            let x = lerp(mouseX, pmouseX, i / trailLength);
            let y = lerp(mouseY, pmouseY, i / trailLength);
            let size = lerp(d, 5 * scaleFactor, i / trailLength);
            let alpha = lerp(currentAlpha, 50, i / trailLength);
            
            let trailColor = color(cPrimary.levels[0], cPrimary.levels[1], cPrimary.levels[2], alpha);
            fill(trailColor);
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

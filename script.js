document.addEventListener('DOMContentLoaded', () => {
    // 폼 입력 요소들
    const titleInput = document.getElementById('title');
    const rewardInput = document.getElementById('reward');
    const targetInput = document.getElementById('target');
    const dateInput = document.getElementById('date');
    const themeColorInput = document.getElementById('theme-color');

    // 캔버스 내 실시간 반영 요소들
    const previewTitle = document.getElementById('preview-title');
    const previewReward = document.getElementById('preview-reward');
    const previewTarget = document.getElementById('preview-target');
    const previewDate = document.getElementById('preview-date');
    const badge = document.getElementById('preview-badge');
    const root = document.documentElement;

    // 텍스트 업데이트 헬퍼 함수
    const updateText = (element, value, defaultText) => {
        element.textContent = value.trim() || defaultText;
    };

    // 테마 컬러 변경 함수
    const updateThemeColor = (color) => {
        // CSS 변수를 통해 글로벌 primary 색상 변경
        root.style.setProperty('--primary', color);
        
        // 뱃지 배경을 위한 알파(투명도) 컬러 생성
        const hex2rgba = (hex, alpha = 0.1) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        try {
            badge.style.backgroundColor = hex2rgba(color, 0.1);
            badge.style.color = color; // 뱃지 텍스트 색상도 맞춰줌
        } catch (e) {
            console.error('컬러 변환 오류:', e);
        }
    };

    // 실시간 이벤트 리스너 등록
    titleInput.addEventListener('input', (e) => updateText(previewTitle, e.target.value, '진행할 리서치 제목을 입력해주세요'));
    rewardInput.addEventListener('input', (e) => updateText(previewReward, e.target.value, '보상 미정'));
    targetInput.addEventListener('input', (e) => updateText(previewTarget, e.target.value, '제한 없음'));
    dateInput.addEventListener('input', (e) => updateText(previewDate, e.target.value, '일정 미정'));
    
    themeColorInput.addEventListener('input', (e) => updateThemeColor(e.target.value));
});
